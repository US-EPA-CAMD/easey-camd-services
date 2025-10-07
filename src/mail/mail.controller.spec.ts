import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { CreateMailDto } from '../dto/create-mail.dto';
import { MailController } from './mail.controller';
import { ProcessMailDTO } from '../dto/process-mail.dto';
import { EvaluationReportService } from './evaluation-report.service';
import { EaseyContentTemplateService } from './easey-content-template.service';
import { MailService } from './mail.service';
import { MassEvalParamsDTO } from '../dto/mass-eval-params.dto';
import { RecipientListService } from '../submission/recipient-list.service';
import { EmailRecipientListRequestDto } from '../dto/email-recipient-list-request.dto';
import { EmailRecipientListResponseDto } from '../dto/email-recipient-list-response.dto';

const mockEvaluationReportService = () => ({
  sendMassEvalEmail: jest.fn(),
});

const mockTemplateService = () => ({});

const mockEmailService = () => ({
  sendTemplateEmail: jest.fn(),
  sendContactUsEmail: jest.fn(),
  sendEmailToSendRecord: jest.fn().mockResolvedValue({ success: true }),
});

const mockRecipientListService = () => ({
  getEmailRecipientList: jest.fn(),
});

describe('Mail Controller', () => {
  let controller: MailController;
  let evaluationReportService: EvaluationReportService;
  let easeyContentTemplateService: EaseyContentTemplateService;
  let mailService: MailService;
  let recipientListService: RecipientListService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [MailController],
      providers: [
        { provide: EvaluationReportService, useFactory: mockEvaluationReportService },
        { provide: EaseyContentTemplateService, useFactory: mockTemplateService },
        { provide: MailService, useFactory: mockEmailService },
        { provide: RecipientListService, useFactory: mockRecipientListService },
        ConfigService,
      ],
    }).compile();

    evaluationReportService = module.get(EvaluationReportService);
    easeyContentTemplateService = module.get(EaseyContentTemplateService);
    mailService = module.get(MailService);
    recipientListService = module.get(RecipientListService);
    controller = module.get(MailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call the email service for contact us', () => {
    const dto = new CreateMailDto();
    controller.send(dto, 'client123');

    expect(mailService.sendContactUsEmail).toHaveBeenCalledWith('client123', dto);
  });

  it('should call the mass-eval service', () => {
    controller.sendMassEval(new MassEvalParamsDTO());

    expect(evaluationReportService.sendMassEvalEmail).toHaveBeenCalled();
  });

  it('should call the email service for database email', () => {
    const dto = new ProcessMailDTO();
    dto.emailToSendId = 123;
    controller.sendRecord(dto);

    expect(mailService.sendEmailToSendRecord).toHaveBeenCalledWith(123);
  });

  it('should call the recipient list service', async () => {
    const mockRequest: EmailRecipientListRequestDto = {
      emailType: 'SUBMISSIONREMINDER',
      plantIdList: [1, 3, 5],
    };

    const mockResponse: EmailRecipientListResponseDto = {
      recipients: [
        {
          emailAddressList: 'test@example.com',
          plantIdList: [1, 3, 5],
        },
      ],
      hasError: false,
      errorMessage: '',
    };

    recipientListService.getEmailRecipientList = jest.fn().mockResolvedValue(mockResponse);

    const result = await controller.getEmailRecipientList(mockRequest);

    expect(recipientListService.getEmailRecipientList).toHaveBeenCalledWith(mockRequest);
    expect(result).toEqual(mockResponse);
  });
});
