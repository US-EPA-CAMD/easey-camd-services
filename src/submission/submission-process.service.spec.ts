import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionProcessService } from './submission-process.service';
import { EntityManager, QueryRunner } from 'typeorm';
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

  // Helper function to setup common mocks
  const setupCommonMocks = (submissionSet: SubmissionSet, submissionSetRecords: SubmissionQueue[]) => {
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
  };

  beforeEach(async () => {
    const queryRunner = {
      connection: {
        name: 'default',
        options: {},
        logger: {} as any,
      },
      manager: {} as any,
      broadcaster: {} as any,
      isReleased: false,
      isTransactionActive: false,
      databaseConnection: null,
      loadedTables: [],
      loadedViews: [],
      schemaPaths: [],
      data: {},
      enabled: true,
      connect: jest.fn(),
      release: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      query: jest.fn(),
      stream: jest.fn(),
      clearTable: jest.fn(),
      hasTable: jest.fn(),
      getTable: jest.fn(),
      getTables: jest.fn(),
      getView: jest.fn(),
      getViews: jest.fn(),
      getCurrentSchema: jest.fn(),
      getCurrentDatabase: jest.fn(),
      getTablePath: jest.fn(),
      getTableSchema: jest.fn(),
      getTableName: jest.fn(),
      hasColumn: jest.fn(),
      getColumn: jest.fn(),
      getColumns: jest.fn(),
      getPrimaryColumns: jest.fn(),
      getGeneratedColumns: jest.fn(),
      hasIndex: jest.fn(),
      getIndex: jest.fn(),
      getIndices: jest.fn(),
      hasForeignKey: jest.fn(),
      getForeignKey: jest.fn(),
      getForeignKeys: jest.fn(),
      executeMemoryDownSql: jest.fn(),
      executeMemoryUpSql: jest.fn(),
      updateLevel: jest.fn(),
      beforeMigration: jest.fn(),
      afterMigration: jest.fn(),
      beforeQuery: jest.fn(),
      afterQuery: jest.fn(),
      withoutForeignKeys: jest.fn(),
      withoutIndices: jest.fn(),
      withoutTables: jest.fn(),
      withoutViews: jest.fn(),
      build: jest.fn(),
      getMemoryLog: jest.fn(),
      getQueryRunner: jest.fn(),
      getRepository: jest.fn(),
      getTreeRepository: jest.fn(),
      getMongoRepository: jest.fn(),
      startQueryRunner: jest.fn()
    } as unknown as QueryRunner;

    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        SubmissionProcessService,
        {
          provide: EntityManager,
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            transaction: jest.fn().mockImplementation(async (cb) => {
              const result = await cb(entityManager);
              return result;
            }),
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
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
    it('should copy to official when there are no CRIT1 errors', async () => {
      const setId = 'test-set-id';
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = setId;

      const submissionQueueRecords = [
        { severityCode: 'CRIT2' },
        { severityCode: 'CRIT3' }
      ];

      jest.spyOn(entityManager, 'find').mockResolvedValueOnce(submissionQueueRecords as any);

      const transactions = [
        { command: 'INSERT INTO test VALUES (?)', params: ['test'] }
      ];

      await service.copyToOfficial(submissionSet, transactions);

      expect(entityManager.find).toHaveBeenCalledWith(SubmissionQueue, {
        where: { submissionSetIdentifier: setId }
      });
      expect(entityManager.transaction).toHaveBeenCalled();
    });

    it('should not copy to official when there are CRIT1 errors', async () => {
      const setId = 'test-set-id';
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = setId;

      const submissionQueueRecords = [
        { severityCode: 'CRIT1' },
        { severityCode: 'CRIT2' }
      ];

      jest.spyOn(entityManager, 'find').mockResolvedValueOnce(submissionQueueRecords as any);

      const transactions = [
        { command: 'INSERT INTO test VALUES (?)', params: ['test'] }
      ];

      await service.copyToOfficial(submissionSet, transactions);

      expect(entityManager.find).toHaveBeenCalledWith(SubmissionQueue, {
        where: { submissionSetIdentifier: setId }
      });
      expect(entityManager.transaction).not.toHaveBeenCalled();
    });
  });

  describe('processSubmissionSet', () => {
    it('should process a submission set with CRIT2 errors successfully', async () => {
      const setId = 'test-set-id';
      const submissionSet = new SubmissionSet();
      submissionSet.submissionSetIdentifier = setId;

      const submissionSetRecords = [
        Object.assign(new SubmissionQueue(), {
          severityCode: 'CRIT2',
          statusCode: 'QUEUED'
        })
      ];

      setupCommonMocks(submissionSet, submissionSetRecords);

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

      // Verify final status is set correctly for CRIT2
      expect(service['submissionSetHelper'].setRecordStatusCode).toHaveBeenCalledWith(
        submissionSet,
        submissionSetRecords.filter(r => r.statusCode !== 'ERROR'),
        'COMPLETE',
        '',
        'UPDATED' // Should be UPDATED for CRIT2, not CRITERR
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

      setupCommonMocks(submissionSet, submissionSetRecords);
      jest.spyOn(service['transactionService'], 'buildTransactions').mockRejectedValue(error);

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
