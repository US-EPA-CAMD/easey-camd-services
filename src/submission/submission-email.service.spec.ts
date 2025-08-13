import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionEmailService } from './submission-email.service';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSetService } from '../dataset/dataset.service';
import { SubmissionFeedbackRecordService } from './submission-feedback-record.service';
import { SubmissionTemplateService } from './submission-template.service';
import { MailEvalService } from '../mail/mail-eval.service';
import { RecipientListService } from './recipient-list.service';
import { ErrorHandlerService } from './error-handler.service';
import { SubmissionSet } from '../entities/submission-set.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import { SeverityCode } from '../entities/severity-code.entity';

describe('SubmissionEmailService', () => {
  let service: SubmissionEmailService;
  let entityManager: EntityManager;
  let configService: ConfigService;
  let errorHandlerService: ErrorHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        SubmissionEmailService,
        {
          provide: EntityManager,
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            query: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-value'),
          },
        },
        {
          provide: DataSetService,
          useValue: {
            getDataSet: jest.fn(),
          },
        },
        {
          provide: SubmissionFeedbackRecordService,
          useValue: {
            getSubmissionReceiptData: jest.fn(),
            generateSummaryTableForUnitStack: jest.fn(),
            generateQATable: jest.fn(),
            getDisplayDate: jest.fn(),
          },
        },
        {
          provide: SubmissionTemplateService,
          useValue: {
            renderTemplate: jest.fn(),
          },
        },
        {
          provide: MailEvalService,
          useValue: {
            buildEvalReports: jest.fn(),
          },
        },
        {
          provide: RecipientListService,
          useValue: {
            getEmailRecipients: jest.fn(),
          },
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SubmissionEmailService>(SubmissionEmailService);
    entityManager = module.get<EntityManager>(EntityManager);
    configService = module.get<ConfigService>(ConfigService);
    errorHandlerService = module.get<ErrorHandlerService>(ErrorHandlerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('collectFeedbackReportDataForEmail', () => {
    it('should collect feedback report data', async () => {
      const set = new SubmissionSet();
      const submissionSetRecords = [new SubmissionQueue()];
      const severityCodes = [new SeverityCode()];
      const feedbackEmailData = {};
      const stages: { action: string; dateTime: string }[] = [];
      stages.push({ action: 'SUBMISSION_LOADED', dateTime: 'N/A' });
      stages.push({ action: 'SET_STATUS_WIP', dateTime: 'N/A' });

      (entityManager.find as jest.Mock).mockResolvedValueOnce(severityCodes);

      jest.spyOn(service, 'groupSubmissionRecords').mockReturnValue({
        'MP': { processCode: 'MP', records: submissionSetRecords },
        'qaCriticalRecords': { processCode: 'QA_CRITICAL', records: [] },
        'qaNonCriticalRecords': { processCode: 'QA_NON_CRITICAL', records: [] },
        'EM': { processCode: 'EM', records: [] },
      });

      jest
        .spyOn(service as any, 'getSubmissionFeedbackEmailData')
        .mockResolvedValue(feedbackEmailData);

      const result = await service.collectFeedbackReportDataForEmail(set, submissionSetRecords, stages);

      expect(result).toContain(feedbackEmailData);
    });

  });

  // TESTS FOR EM GROUPING FIX
  describe('groupSubmissionRecords - EM Grouping Fix Tests', () => {
    it('should group multiple EM records into single EM group (TT6771 fix)', () => {
      const mockRecords = [
        { processCode: 'EM', monLocationId: 'unit3', submissionSetIdentifier: 'test-set' },
        { processCode: 'EM', monLocationId: 'unit4', submissionSetIdentifier: 'test-set' },
        { processCode: 'EM', monLocationId: 'CT5', submissionSetIdentifier: 'test-set' },
        { processCode: 'EM', monLocationId: 'CT7', submissionSetIdentifier: 'test-set' },
      ] as any[];

      const result = service.groupSubmissionRecords(mockRecords);

      // Should have single EM group with all 4 records (ORIS 2706 scenario)
      expect(result.EM).toBeDefined();
      expect(result.EM.records).toHaveLength(4);
      expect(result.EM.processCode).toBe('EM');

      expect(result['EM_0']).toBeUndefined();
      expect(result['EM_1']).toBeUndefined();
      expect(result['EM_2']).toBeUndefined();
      expect(result['EM_3']).toBeUndefined();
    });

    it('should maintain MP and QA grouping behavior unchanged', () => {
      const mockRecords = [
        { processCode: 'MP', submissionSetIdentifier: 'test-set' },
        { processCode: 'QA', severityCode: 'CRIT1', testSumIdentifier: 'test1' },
        { processCode: 'QA', severityCode: 'INFORM', qaCertEventIdentifier: 'cert1' },
      ] as any[];

      const result = service.groupSubmissionRecords(mockRecords);

      // MP should remain single group
      expect(result.MP.records).toHaveLength(1);
      expect(result.MP.processCode).toBe('MP');

      // QA should remain split by severity
      expect(result.qaCriticalRecords.records).toHaveLength(1);
      expect(result.qaNonCriticalRecords.records).toHaveLength(1);
    });

    it('should handle mixed submission with MP, QA, and EM records correctly', () => {
      const mockRecords = [
        { processCode: 'MP', submissionSetIdentifier: 'test-set' },
        { processCode: 'QA', severityCode: 'CRIT1', testSumIdentifier: 'test1' },
        { processCode: 'EM', monLocationId: 'unit3', submissionSetIdentifier: 'test-set' },
        { processCode: 'EM', monLocationId: 'unit4', submissionSetIdentifier: 'test-set' },
        { processCode: 'EM', monLocationId: 'CT5', submissionSetIdentifier: 'test-set' },
        { processCode: 'EM', monLocationId: 'CT7', submissionSetIdentifier: 'test-set' },
      ] as any[];

      const result = service.groupSubmissionRecords(mockRecords);

      // Should generate exactly 3 email groups (not 6 as before the fix):
      // 1. MP: 1 email
      // 2. QA Critical: 1 email
      // 3. EM: 1 email (not 4 emails)
      const nonEmptyGroups = Object.entries(result).filter(([_, group]) => group.records.length > 0);
      expect(nonEmptyGroups).toHaveLength(3);

      expect(result.MP.records).toHaveLength(1);
      expect(result.qaCriticalRecords.records).toHaveLength(1);
      expect(result.EM.records).toHaveLength(4); // All EM records in single group
    });

    it('should handle empty EM records gracefully', () => {
      const mockRecords = [
        { processCode: 'MP', submissionSetIdentifier: 'test-set' },
      ] as any[];

      const result = service.groupSubmissionRecords(mockRecords);

      expect(result.EM).toBeDefined();
      expect(result.EM.records).toHaveLength(0);
      expect(result.EM.processCode).toBe('EM');
    });
  });
});
