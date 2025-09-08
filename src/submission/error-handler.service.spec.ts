import { Test, TestingModule } from '@nestjs/testing';
import { ErrorHandlerService } from './error-handler.service';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { SubmissionSet } from '../entities/submission-set.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import { SubmissionSetHelperService } from './submission-set-helper.service';
import { SubmissionEmailService } from './submission-email.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { SubmissionFeedbackRecordService } from './submission-feedback-record.service';
import { EntityManager } from 'typeorm';
import { Plant } from '../entities/plant.entity';
import { SeverityCode } from '../entities/severity-code.entity';
import { ClientConfigService } from '../mail/client-config.service';

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-error-id'),
}));

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let submissionSetHelper: SubmissionSetHelperService;
  let submissionEmailService: SubmissionEmailService;
  let mailService: MailService;
  let configService: ConfigService;
  let submissionFeedbackRecordService: SubmissionFeedbackRecordService;
  let entityManager: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        ErrorHandlerService,
        {
          provide: SubmissionSetHelperService,
          useValue: {
            updateSubmissionSetStatus: jest.fn(),
            setRecordStatusCode: jest.fn(),
            getFacilityByFacIdentifier: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            query: jest.fn(),
          },
        },
        {
          provide: SubmissionEmailService,
          useValue: {
            getSubmissionType: jest.fn().mockResolvedValue('Test Submission Type'),
            findRecordWithHighestSeverityLevel: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendTemplateEmail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('from@example.com'),
          },
        },
        {
          provide: ClientConfigService,
          useValue: {
            getECMPSClientConfig: jest.fn().mockResolvedValue({
              supportEmail: 'support@example.com',
            }),
          },
        },
        {
          provide: SubmissionFeedbackRecordService,
          useValue: {
            getDisplayDate: jest.fn().mockReturnValue('7/7/2024'),
          },
        },
      ],
    }).compile();

    service = module.get<ErrorHandlerService>(ErrorHandlerService);
    submissionSetHelper = module.get<SubmissionSetHelperService>(SubmissionSetHelperService);
    submissionEmailService = module.get<SubmissionEmailService>(SubmissionEmailService);
    mailService = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
    submissionFeedbackRecordService = module.get<SubmissionFeedbackRecordService>(SubmissionFeedbackRecordService);
    entityManager = module.get<EntityManager>(EntityManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleSubmissionProcessingError', () => {
    it('should handle errors properly and send emails', async () => {
      const set = new SubmissionSet();
      set.userEmail = 'user@example.com';
      set.configuration = 'mock-config';
      set.submissionSetIdentifier = 'mock-submission-id';
      set.facIdentifier = 1;
      set.facName = 'Test Facility';
      set.orisCode = 123;
      set.queuedTime = new Date('2024-07-07T00:00:00Z');

      const queueRecords = [new SubmissionQueue()];
      const error = new Error('Test Error');

      // Mock submissionSetHelper.getFacilityByFacIdentifier
      const facility = new Plant();
      facility.state = 'Test State';
      (submissionSetHelper.getFacilityByFacIdentifier as jest.Mock).mockResolvedValue(facility);

      // Mock entityManager.find for SeverityCode
      const severityCodes = [new SeverityCode()];
      (entityManager.find as jest.Mock).mockResolvedValue(severityCodes);

      const stages: { action: string; dateTime: string }[] = [];
      stages.push({ action: 'SUBMISSION_LOADED', dateTime: 'N/A' });
      stages.push({ action: 'SET_STATUS_WIP', dateTime: 'N/A' });

      // Mock submissionEmailService.findRecordWithHighestSeverityLevel
      const highestSeverityRecord = {
        submissionQueue: {
          processCode: 'EM',
        },
      };
      (submissionEmailService.findRecordWithHighestSeverityLevel as jest.Mock).mockResolvedValue(highestSeverityRecord);

      // Mock submissionEmailService.getSubmissionType
      (submissionEmailService.getSubmissionType as jest.Mock).mockResolvedValue('Emissions');

      await service.handleSubmissionProcessingError(set, queueRecords, stages, error);

      expect(submissionSetHelper.updateSubmissionSetStatus).toHaveBeenCalledWith(
        set,
        'ERROR',
        JSON.stringify({
          message: error.message,
          stack: error.stack,
          name: error.name,
        }),
      );
      expect(submissionSetHelper.setRecordStatusCode).toHaveBeenCalledWith(
        set,
        queueRecords,
        'ERROR',
        JSON.stringify({
          message: error.message,
          stack: error.stack,
          name: error.name,
        }),
        'REQUIRE',
      );

      expect(submissionSetHelper.getFacilityByFacIdentifier).toHaveBeenCalledWith(set.facIdentifier);
      expect(entityManager.find).toHaveBeenCalledWith(SeverityCode);
      expect(submissionEmailService.findRecordWithHighestSeverityLevel).toHaveBeenCalledWith(queueRecords, severityCodes);
      expect(submissionEmailService.getSubmissionType).toHaveBeenCalledWith('EM');
      expect(submissionFeedbackRecordService.getDisplayDate).toHaveBeenCalledWith(set.queuedTime || expect.any(Date));

      expect(mailService.sendTemplateEmail).toHaveBeenCalledTimes(2);

      // Check arguments of sendTemplateEmail
      expect(mailService.sendTemplateEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: expect.any(Number),
          to: 'user@example.com',
          from: 'from@example.com',
          subject: expect.any(String),
          context: expect.any(Object),
        })
      );

      expect(mailService.sendTemplateEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: expect.any(Number),
          to: 'support@example.com',
          from: 'from@example.com',
          subject: expect.any(String),
          context: expect.any(Object),
        })
      );
    });
  });
});
