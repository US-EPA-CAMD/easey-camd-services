import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { CreateMailDto } from '../dto/create-mail.dto';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { ProcessMailDTO } from '../dto/process-mail.dto';
import { MailEvalService } from './mail-eval.service';
import { EaseyContentTemplateService } from './easey-content-template.service';
import { MassEvalParamsDTO } from '../dto/mass-eval-params.dto';
import { RecipientListService } from '../submission/recipient-list.service';
import { EmailRecipientListRequestDto } from '../dto/email-recipient-list-request.dto';
import { EmailRecipientListResponseDto } from '../dto/email-recipient-list-response.dto';

const mockMailService = () => ({
  sendEmail: jest.fn(),
  sendMassEvalEmail: jest.fn(),
  sendEmailRecord: jest.fn(),
});

const mockEvalService = () => ({
  sendMassEvalEmail: jest.fn(),
});

const mockTemplateService = () => ({
  sendEmailRecord: jest.fn(),
});

const mockRecipientListService = () => ({
  getEmailRecipientList: jest.fn(),
});

describe('Mail Controller', () => {
  let controller: MailController;
  let service: MailService;
  let evalService: MailEvalService;
  let easeyContentTemplateService: EaseyContentTemplateService;
  let recipientListService: RecipientListService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [MailController],
      providers: [
        { provide: MailService, useFactory: mockMailService },
        { provide: MailEvalService, useFactory: mockEvalService },
        { provide: EaseyContentTemplateService, useFactory: mockTemplateService },
        { provide: RecipientListService, useFactory: mockRecipientListService },
        ConfigService,
      ],
    }).compile();

    service = module.get(MailService);
    evalService = module.get(MailEvalService);
    easeyContentTemplateService = module.get(EaseyContentTemplateService);
    recipientListService = module.get(RecipientListService);
    controller = module.get(MailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call the basic service', () => {
    controller.send(new CreateMailDto(), '');

    expect(service.sendEmail).toHaveBeenCalled();
  });

  it('should call the mass-eval service', () => {
    controller.sendMassEval(new MassEvalParamsDTO());

    expect(evalService.sendMassEvalEmail).toHaveBeenCalled();
  });

  it('should call the template service', () => {
    controller.sendRecord(new ProcessMailDTO());

    expect(easeyContentTemplateService.sendEmailRecord).toHaveBeenCalled();
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
