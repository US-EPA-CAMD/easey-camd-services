import { Test, TestingModule } from '@nestjs/testing';
import { ErrorHandlerService } from './error-handler.service';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { SubmissionSet } from '../entities/submission-set.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import { SubmissionSetHelperService } from './submission-set-helper.service';
import { SubmissionEmailService } from './submission-email.service';
import { MailEvalService } from '../mail/mail-eval.service';
import { ConfigService } from '@nestjs/config';
import { SubmissionFeedbackRecordService } from './submission-feedback-record.service';

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-error-id'),
}));

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let submissionSetHelper: SubmissionSetHelperService;
  let submissionEmailService: SubmissionEmailService;
  let mailEvalService: MailEvalService;
  let configService: ConfigService;

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
          },
        },
        {
          provide: SubmissionEmailService,
          useValue: {
            getECMPSClientConfig: jest.fn().mockResolvedValue({
              supportEmail: 'support@example.com',
            }),
          },
        },
        {
          provide: MailEvalService,
          useValue: {
            sendEmailWithRetry: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('from@example.com'),
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
    mailEvalService = module.get<MailEvalService>(MailEvalService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    it('should handle errors and send emails', async () => {
      const set = new SubmissionSet();
      set.userEmail = 'user@example.com';
      set.configuration = 'mock-config';
      set.submissionSetIdentifier = 'mock-submission-id';

      const queueRecords = [new SubmissionQueue()];
      const error = new Error('Test Error');

      await service.handleSubmissionProcessingError(set, queueRecords, error);

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
        'Process failure, see set details',
        'REQUIRE',
      );
      expect(mailEvalService.sendEmailWithRetry).toHaveBeenCalledTimes(2);
    });
  });
});
