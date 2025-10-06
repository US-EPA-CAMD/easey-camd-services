import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionProcessService } from './submission-process.service';
import { EntityManager } from 'typeorm';
import { LoggerModule, Logger } from '@us-epa-camd/easey-common/logger';
import { MailService } from '../mail/mail.service';
import { DocumentService } from './document.service';
import { SubmissionTransactionService } from './submission-transaction.service';
import { ErrorHandlerService } from './error-handler.service';
import { SubmissionSetHelperService } from './submission-set-helper.service';
import { SubmissionEmailService } from './submission-email.service';
import { SeverityCode } from '../entities/severity-code.entity';
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
            update: jest.fn(),
            transaction: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendTemplateEmail: jest.fn(),
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

  describe('processSubmissionSet', () => {
    it('should process a submission set successfully', async () => {
      const setId = 'test-set-id';
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = setId;
      submissionSet.statusCode = 'QUEUED';
      submissionSet.hasCritErrors = false;

      const severityCode = new SeverityCode();
      severityCode.evalStatusCode = 'PASS';

      const submissionQueue = new SubmissionQueue();
      submissionQueue.severityCodeRecord = severityCode;

      const submissionSetRecords = [submissionQueue];

      jest.spyOn(entityManager, 'findOne')
        .mockResolvedValueOnce(submissionSet) // Initial fetch
        .mockResolvedValueOnce(submissionSet); // Refresh after atomic update
      jest.spyOn(entityManager, 'update').mockResolvedValueOnce({ affected: 1, raw: {}, generatedMaps: [] });
      jest.spyOn(entityManager, 'find').mockResolvedValueOnce(submissionSetRecords);
      jest.spyOn(service['submissionSetHelper'], 'updateSubmissionSetStatus').mockResolvedValue();
      jest.spyOn(service['submissionSetHelper'], 'setRecordStatusCode').mockResolvedValue();
      jest.spyOn(service['submissionSetHelper'], 'getFormattedDateTime').mockResolvedValue('2024-01-01T00:00:00Z');
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

      expect(entityManager.update).toHaveBeenCalledWith(
        SubmissionSet,
        { submissionSetIdentifier: setId, statusCode: 'QUEUED' },
        { statusCode: 'WIP', startedTime: expect.any(Date) }
      );
      expect(entityManager.find).toHaveBeenCalledWith(SubmissionQueue, {
        where: { submissionSetIdentifier: setId },
        relations: { severityCodeRecord: true },
      });
      expect(service['submissionSetHelper'].updateSubmissionSetStatus).toHaveBeenCalledWith(
        submissionSet,
        'WIP',
      );
      expect(service['submissionSetHelper'].setRecordStatusCode).toHaveBeenCalledWith(
        submissionSet,
        submissionSetRecords[0],
        'WIP',
        '',
        'PENDING',
      );
    });

    it('should handle errors and call error handler properly', async () => {
      const setId = 'test-set-id';
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = setId;
      submissionSet.statusCode = 'QUEUED';
      const submissionSetRecords = [new SubmissionQueue()];
      const error = new Error('Test Error');

      jest.spyOn(entityManager, 'findOne')
        .mockResolvedValueOnce(submissionSet) // Initial fetch
        .mockResolvedValueOnce(submissionSet); // Refresh after atomic update
      jest.spyOn(entityManager, 'update').mockResolvedValueOnce({ affected: 1, raw: {}, generatedMaps: [] });
      jest.spyOn(entityManager, 'find').mockResolvedValueOnce(submissionSetRecords);
      jest.spyOn(service['submissionSetHelper'], 'updateSubmissionSetStatus').mockResolvedValue();
      jest.spyOn(service['submissionSetHelper'], 'setRecordStatusCode').mockResolvedValue();
      jest.spyOn(service['submissionSetHelper'], 'getFormattedDateTime').mockResolvedValue('2024-01-01T00:00:00Z');
      jest.mock('uuidv4', () => ({ v4: () => 'mock-uuid' }));
      jest.spyOn(fsPromises, 'rm').mockResolvedValue();
      jest.spyOn(service['transactionService'], 'buildTransactions').mockRejectedValue(error);
      jest.spyOn(service['errorHandlerService'], 'handleSubmissionProcessingError').mockResolvedValue();

      await service.processSubmissionSet(setId);

      expect(service['errorHandlerService'].handleSubmissionProcessingError).toHaveBeenCalledWith(
        submissionSet,
        submissionSetRecords,
        expect.any(Array), // submissionStages array
        error,
      );
    });

    // TESTS FOR DUPLICATE EMAIL FIX
    describe('Race Condition Prevention Tests', () => {
      it('should skip processing when submission set is already WIP', async () => {
        const setId = 'test-set-id';
        const submissionSet = new SubmissionSet();
        submissionSet.submissionSetIdentifier = setId;
        submissionSet.statusCode = 'WIP'; // Already in progress

        jest.spyOn(entityManager, 'findOne').mockResolvedValueOnce(submissionSet);
        const loggerWarnSpy = jest.spyOn(service['logger'], 'warn');

        await service.processSubmissionSet(setId);

        expect(loggerWarnSpy).toHaveBeenCalledWith(`SubmissionSet ${setId} is already WIP, skipping duplicate processing.`);
      });

      it('should skip processing when submission set is already COMPLETE', async () => {
        const setId = 'test-set-id';
        const submissionSet = new SubmissionSet();
        submissionSet.submissionSetIdentifier = setId;
        submissionSet.statusCode = 'COMPLETE'; // Already completed

        jest.spyOn(entityManager, 'findOne').mockResolvedValueOnce(submissionSet);
        const loggerWarnSpy = jest.spyOn(service['logger'], 'warn');

        await service.processSubmissionSet(setId);

        expect(loggerWarnSpy).toHaveBeenCalledWith(`SubmissionSet ${setId} is already COMPLETE, skipping duplicate processing.`);
      });

      it('should skip processing when atomic update fails (already processed by another instance)', async () => {
        const setId = 'test-set-id';
        const submissionSet = new SubmissionSet();
        submissionSet.submissionSetIdentifier = setId;
        submissionSet.statusCode = 'QUEUED';

        jest.spyOn(entityManager, 'findOne').mockResolvedValueOnce(submissionSet);
        // Mock atomic update to return 0 affected rows (already processed)
        jest.spyOn(entityManager, 'update').mockResolvedValueOnce({ affected: 0, raw: {}, generatedMaps: [] });
        const loggerWarnSpy = jest.spyOn(service['logger'], 'warn');

        await service.processSubmissionSet(setId);

        expect(entityManager.update).toHaveBeenCalledWith(
          SubmissionSet,
          { submissionSetIdentifier: setId, statusCode: 'QUEUED' },
          { statusCode: 'WIP', startedTime: expect.any(Date) }
        );
        expect(loggerWarnSpy).toHaveBeenCalledWith(`SubmissionSet ${setId} was already processed by another instance, skipping.`);
      });

      it('should proceed with processing when atomic update succeeds', async () => {
        const setId = 'test-set-id';
        const submissionSet = new SubmissionSet();
        submissionSet.submissionSetIdentifier = setId;
        submissionSet.statusCode = 'QUEUED';

        jest.spyOn(entityManager, 'findOne')
          .mockResolvedValueOnce(submissionSet) // Initial fetch
          .mockResolvedValueOnce(submissionSet); // Refresh after atomic update

        // Mock successful atomic update
        jest.spyOn(entityManager, 'update').mockResolvedValueOnce({ affected: 1, raw: {}, generatedMaps: [] });
        jest.spyOn(entityManager, 'find').mockResolvedValueOnce([]);
        jest.spyOn(service['submissionSetHelper'], 'updateSubmissionSetStatus').mockResolvedValue();
        jest.spyOn(service['submissionSetHelper'], 'setRecordStatusCode').mockResolvedValue();
        jest.spyOn(service['submissionSetHelper'], 'getFormattedDateTime').mockResolvedValue('2024-01-01T00:00:00Z');

        const loggerLogSpy = jest.spyOn(service['logger'], 'log');

        // Mock other dependencies to prevent actual processing
        jest.spyOn(service['transactionService'], 'buildTransactions').mockRejectedValue(new Error('Stop here'));
        jest.spyOn(service['errorHandlerService'], 'handleSubmissionProcessingError').mockResolvedValue();

        await service.processSubmissionSet(setId);

        expect(entityManager.update).toHaveBeenCalledWith(
          SubmissionSet,
          { submissionSetIdentifier: setId, statusCode: 'QUEUED' },
          { statusCode: 'WIP', startedTime: expect.any(Date) }
        );
        expect(loggerLogSpy).toHaveBeenCalledWith(`Successfully acquired lock for SubmissionSet ${setId}, proceeding with processing.`);
      });
    });
  });
});
