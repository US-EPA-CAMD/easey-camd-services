import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionProcessService } from './submission-process.service';
import { EntityManager } from 'typeorm';
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
    it('should copy data when there are no Critical 1 Errors', async () => {
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = 'test-set-id';

      const submissionQueueRecords = [
        { severityCode: 'NONE' },
        { severityCode: 'CRIT2' } // Critical 2 Error should still allow copying
      ];

      const transactions = [
        { command: 'SQL_COMMAND_1', params: [] },
        { command: 'SQL_COMMAND_2', params: [] }
      ];

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        await callback({ query: jest.fn() });
      });

      jest.spyOn(entityManager, 'find').mockResolvedValueOnce(submissionQueueRecords);
      jest.spyOn(entityManager, 'transaction').mockImplementation(mockTransaction);

      await service.copyToOfficial(submissionSet, transactions);

      expect(entityManager.find).toHaveBeenCalledWith(SubmissionQueue, {
        where: { submissionSetIdentifier: 'test-set-id' }
      });
      expect(entityManager.transaction).toHaveBeenCalled();
    });

    it('should not copy data when there are Critical 1 Errors', async () => {
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = 'test-set-id';

      const submissionQueueRecords = [
        { severityCode: 'NONE' },
        { severityCode: 'CRIT1' } // Critical 1 Error should prevent copying
      ];

      const transactions = [
        { command: 'SQL_COMMAND_1', params: [] },
        { command: 'SQL_COMMAND_2', params: [] }
      ];

      // Mock the find method to return records with a Critical 1 Error
      jest.spyOn(entityManager, 'find').mockResolvedValueOnce(submissionQueueRecords);

      // Mock the transaction method
      jest.spyOn(entityManager, 'transaction');

      // Mock the logger to avoid test issues
      jest.spyOn(logger, 'log').mockImplementation(() => {});

      await service.copyToOfficial(submissionSet, transactions);

      // Verify that find was called with the correct parameters
      expect(entityManager.find).toHaveBeenCalledWith(SubmissionQueue, {
        where: { submissionSetIdentifier: 'test-set-id' }
      });

      // Verify that transaction was not called (because of Critical 1 Errors)
      expect(entityManager.transaction).not.toHaveBeenCalled();

      // Note: We're not testing the log message as it's an implementation detail
      // The important behavior is that the transaction is not called when there are Critical 1 Errors
    });
  });

  describe('processSubmissionSet', () => {
    it('should process a submission set successfully', async () => {
      const setId = 'test-set-id';
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = setId;
      submissionSet.hasCritErrors = false;

      const submissionSetRecords = [
        { statusCode: 'QUEUED', severityCode: 'NONE' }
      ];

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

    it('should set status to CRITERR when there are Critical 1 Errors', async () => {
      const setId = 'test-set-id';
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = setId;

      const submissionSetRecords = [
        { statusCode: 'QUEUED', severityCode: 'CRIT1' }
      ];

      jest.spyOn(entityManager, 'findOne').mockResolvedValueOnce(submissionSet);
      jest.spyOn(entityManager, 'find').mockResolvedValueOnce(submissionSetRecords);
      jest.spyOn(service['submissionSetHelper'], 'updateSubmissionSetStatus').mockResolvedValue();
      jest.spyOn(service['submissionSetHelper'], 'setRecordStatusCode').mockResolvedValue();
      jest.spyOn(fsPromises, 'rm').mockResolvedValue();
      jest.spyOn(fs, 'mkdirSync').mockImplementation(() => 'mock-directory-path');
      jest.spyOn(service['transactionService'], 'buildTransactions').mockResolvedValue([]);
      jest.spyOn(service['documentService'], 'buildDocumentsAndWriteToFile').mockResolvedValue([]);
      jest.spyOn(service['documentService'], 'sendForSigning').mockResolvedValue();
      jest.spyOn(service['submissionEmailService'], 'collectFeedbackReportDataForEmail').mockResolvedValue([]);
      jest.spyOn(service, 'copyToOfficial').mockResolvedValue();

      await service.processSubmissionSet(setId);

      // Verify that setRecordStatusCode was called with 'CRITERR' for Critical 1 Errors
      expect(service['submissionSetHelper'].setRecordStatusCode).toHaveBeenCalledWith(
        submissionSet,
        expect.any(Array),
        'COMPLETE',
        '',
        'CRITERR'
      );
    });

    it('should set status to UPDATED when there are Critical 2 Errors but no Critical 1 Errors', async () => {
      const setId = 'test-set-id';
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = setId;

      const submissionSetRecords = [
        { statusCode: 'QUEUED', severityCode: 'CRIT2' }
      ];

      jest.spyOn(entityManager, 'findOne').mockResolvedValueOnce(submissionSet);
      jest.spyOn(entityManager, 'find').mockResolvedValueOnce(submissionSetRecords);
      jest.spyOn(service['submissionSetHelper'], 'updateSubmissionSetStatus').mockResolvedValue();
      jest.spyOn(service['submissionSetHelper'], 'setRecordStatusCode').mockResolvedValue();
      jest.spyOn(fsPromises, 'rm').mockResolvedValue();
      jest.spyOn(fs, 'mkdirSync').mockImplementation(() => 'mock-directory-path');
      jest.spyOn(service['transactionService'], 'buildTransactions').mockResolvedValue([]);
      jest.spyOn(service['documentService'], 'buildDocumentsAndWriteToFile').mockResolvedValue([]);
      jest.spyOn(service['documentService'], 'sendForSigning').mockResolvedValue();
      jest.spyOn(service['submissionEmailService'], 'collectFeedbackReportDataForEmail').mockResolvedValue([]);
      jest.spyOn(service, 'copyToOfficial').mockResolvedValue();

      await service.processSubmissionSet(setId);

      // Verify that setRecordStatusCode was called with 'UPDATED' for Critical 2 Errors
      expect(service['submissionSetHelper'].setRecordStatusCode).toHaveBeenCalledWith(
        submissionSet,
        expect.any(Array),
        'COMPLETE',
        '',
        'UPDATED'
      );
    });

    it('should handle errors and call error handler properly', async () => {
      const setId = 'test-set-id';
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = setId;
      const submissionSetRecords = [
        { statusCode: 'QUEUED', severityCode: 'NONE' }
      ];
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
