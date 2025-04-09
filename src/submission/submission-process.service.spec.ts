import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionProcessService } from './submission-process.service';
import { EntityManager, In } from 'typeorm';
import { LoggerModule, Logger } from '@us-epa-camd/easey-common/logger';
import { MailEvalService } from '../mail/mail-eval.service';
import { DocumentService } from './document.service';
import { SubmissionTransactionService } from './submission-transaction.service';
import { ErrorHandlerService } from './error-handler.service';
import { SubmissionSetHelperService } from './submission-set-helper.service';
import { SubmissionEmailService } from './submission-email.service';
import { SubmissionSet } from '../entities/submission-set.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import * as fsPromises from 'fs/promises';
import * as fs from 'node:fs';

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
  mkdirSync: jest.fn(),
}));

describe('SubmissionProcessService', () => {
  let service: SubmissionProcessService;
  let entityManager: EntityManager;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        SubmissionProcessService,
        {
          provide: EntityManager,
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            transaction: jest.fn(),
            query: jest.fn(),
          },
        },
        {
          provide: MailEvalService,
          useValue: {
            sendEmailWithRetry: jest.fn(),
          },
        },
        {
          provide: DocumentService,
          useValue: {
            buildDocuments: jest.fn(),
            sendForSigning: jest.fn(),
            buildDocumentsAndWriteToFile: jest.fn(),
          },
        },
        {
          provide: SubmissionTransactionService,
          useValue: {
            buildTransactions: jest.fn(),
          },
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jest.fn(),
            handleQueueingError: jest.fn(),
            handleSubmissionProcessingError: jest.fn(),
            sendEmail: jest.fn(),
          },
        },
        {
          provide: SubmissionSetHelperService,
          useValue: {
            updateSubmissionSetStatus: jest.fn(),
            setRecordStatusCode: jest.fn(),
            getFormattedDateTime: jest.fn(),
          },
        },
        {
          provide: SubmissionEmailService,
          useValue: {
            collectFeedbackReportDataForEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SubmissionProcessService>(SubmissionProcessService);
    entityManager = module.get<EntityManager>(EntityManager);
    logger = await module.resolve<Logger>(Logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('copyToOfficial', () => {
    it('should not copy to official when CRIT1 severity codes are present', async () => {
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = 'test-set-id';

      const transactions = [{ command: 'TEST COMMAND', params: [] }];

      // Mock finding records with CRIT1 severity code
      jest.spyOn(entityManager, 'find').mockResolvedValueOnce([new SubmissionQueue()]);

      // Mock transaction function
      const transactionMock = jest.fn();
      jest.spyOn(entityManager, 'transaction').mockImplementation(transactionMock);

      await service.copyToOfficial(submissionSet, transactions);

      // To verify that find was called with the correct parameters
      expect(entityManager.find).toHaveBeenCalledWith(SubmissionQueue, {
        where: {
          submissionSetIdentifier: submissionSet.submissionSetIdentifier,
          severityCode: In(['CRIT1', 'FATAL'])
        }
      });

      // To verify that transaction was not called since critical errors were found
      expect(transactionMock).not.toHaveBeenCalled();
    });

    it('should copy to official when no CRIT1 or FATAL severity codes are present', async () => {
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = 'test-set-id';

      const transactions = [{ command: 'TEST COMMAND', params: [] }];

      // Mock finding no records with CRIT1 or FATAL severity code
      jest.spyOn(entityManager, 'find').mockResolvedValueOnce([]);

      // Mock transaction function
      const transactionMock = jest.fn().mockImplementation(callback => callback(entityManager));
      jest.spyOn(entityManager, 'transaction').mockImplementation(transactionMock);

      // Mock query execution
      const queryMock = jest.fn();
      jest.spyOn(entityManager, 'query').mockImplementation(queryMock);

      await service.copyToOfficial(submissionSet, transactions);

      // Verify that find was called with the correct parameters
      expect(entityManager.find).toHaveBeenCalledWith(SubmissionQueue, {
        where: {
          submissionSetIdentifier: submissionSet.submissionSetIdentifier,
          severityCode: In(['CRIT1', 'FATAL'])
        }
      });

      // To verify that transaction was called since no critical errors were found
      expect(transactionMock).toHaveBeenCalled();

      // To verify that query was called for each transaction
      expect(queryMock).toHaveBeenCalledWith(transactions[0].command, transactions[0].params);
    });

    it('should handle errors during copyToOfficial', async () => {
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = 'test-set-id';

      const transactions = [{ command: 'TEST COMMAND', params: [] }];
      const error = new Error('Test Error');

      // Mock finding no records with CRIT1 or FATAL severity code
      jest.spyOn(entityManager, 'find').mockResolvedValueOnce([]);

      // Mock transaction function that throws an error
      jest.spyOn(entityManager, 'transaction').mockRejectedValueOnce(error);

      // Expect the function to throw the error
      await expect(service.copyToOfficial(submissionSet, transactions)).rejects.toThrow(error);

     });
  });

  describe('processSubmissionSet', () => {
    it('should process a submission set successfully', async () => {
      const setId = 'test-set-id';
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = setId;
      submissionSet.hasCritErrors = false;

      const submissionSetRecords = [new SubmissionQueue()];

      jest.spyOn(entityManager, 'findOne').mockResolvedValueOnce(submissionSet);
      jest.spyOn(entityManager, 'find').mockResolvedValueOnce(submissionSetRecords);
      jest.spyOn(service['submissionSetHelper'], 'updateSubmissionSetStatus').mockResolvedValue();
      jest.spyOn(service['submissionSetHelper'], 'setRecordStatusCode').mockResolvedValue();
      jest.mock('uuidv4', () => ({ v4: () => 'mock-uuid' }));
      jest.spyOn(fsPromises, 'rm').mockResolvedValue();
      jest.spyOn(fs, 'mkdirSync').mockImplementation(() => 'mock-directory-path');
      jest.spyOn(fsPromises, 'rm').mockResolvedValue();
      jest.spyOn(service['transactionService'], 'buildTransactions').mockResolvedValue([]);
      jest.spyOn(service['documentService'], 'buildDocumentsAndWriteToFile').mockResolvedValue([]);
      jest.spyOn(service['documentService'], 'sendForSigning').mockResolvedValue();
      jest.spyOn(service['submissionEmailService'], 'collectFeedbackReportDataForEmail').mockResolvedValue([]);
      jest.spyOn(service, 'copyToOfficial').mockResolvedValue();

      await service.processSubmissionSet(setId);

      expect(entityManager.findOne).toHaveBeenCalledWith(SubmissionSet, {
        where: { submissionSetIdentifier: setId },
      });
      expect(entityManager.find).toHaveBeenCalledWith(SubmissionQueue, {
        where: { submissionSetIdentifier: setId },
      });
      expect(service['submissionSetHelper'].updateSubmissionSetStatus).toHaveBeenCalledWith(
        submissionSet,
        'WIP',
      );
      expect(service['submissionSetHelper'].setRecordStatusCode).toHaveBeenCalledWith(
        submissionSet,
        submissionSetRecords,
        'WIP',
        '',
        'PENDING',
      );
      expect(service['transactionService'].buildTransactions).toHaveBeenCalled();
      expect(service['documentService'].buildDocumentsAndWriteToFile).toHaveBeenCalled();
      expect(service['documentService'].sendForSigning).toHaveBeenCalled();
      expect(service['submissionEmailService'].collectFeedbackReportDataForEmail).toHaveBeenCalled();
      expect(service.copyToOfficial).toHaveBeenCalled();
      expect(service['submissionSetHelper'].updateSubmissionSetStatus).toHaveBeenCalledWith(
        submissionSet,
        'COMPLETE',
      );
    });

    it('should handle errors and call error handler properly', async () => {
      const setId = 'test-set-id';
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = setId;
      const submissionSetRecords = [new SubmissionQueue()];
      const error = new Error('Test Error');
      const stages: { action: string; dateTime: string }[] = [];
      stages.push({ action: 'SUBMISSION_LOADED', dateTime: 'N/A' });
      stages.push({ action: 'SET_STATUS_WIP', dateTime: 'N/A' });

        jest.spyOn(entityManager, 'findOne').mockResolvedValueOnce(submissionSet);
      jest.spyOn(entityManager, 'find').mockResolvedValueOnce(submissionSetRecords);
      jest.spyOn(service['submissionSetHelper'], 'updateSubmissionSetStatus').mockResolvedValue();
      jest.spyOn(service['submissionSetHelper'], 'setRecordStatusCode').mockResolvedValue();
      jest.mock('uuidv4', () => ({ v4: () => 'mock-uuid' }));
      jest.spyOn(fsPromises, 'rm').mockResolvedValue();
      jest.spyOn(service['transactionService'], 'buildTransactions').mockRejectedValue(error);
      jest.spyOn(service['errorHandlerService'], 'handleSubmissionProcessingError').mockResolvedValue();

      await service.processSubmissionSet(setId);

      expect(service['errorHandlerService'].handleSubmissionProcessingError).toHaveBeenCalledWith(
        submissionSet,
        submissionSetRecords,
        stages,
        error,
      );
    });
  });
});
