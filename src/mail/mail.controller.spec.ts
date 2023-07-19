import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { CreateMailDto } from '../dto/create-mail.dto';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { ProcessMailDTO } from '../dto/process-mail.dto';
import { MailEvalService } from './mail-eval.service';
import { MailTemplateService } from './mail-template.service';
import { MassEvalParamsDTO } from '../dto/mass-eval-params.dto';

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

describe('Mail Controller', () => {
  let controller: MailController;
  let service: MailService;
  let evalService: MailEvalService;
  let templateService: MailTemplateService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [MailController],
      providers: [
        { provide: MailService, useFactory: mockMailService },
        { provide: MailEvalService, useFactory: mockEvalService },
        { provide: MailTemplateService, useFactory: mockTemplateService },
        ConfigService,
      ],
    }).compile();

    service = module.get(MailService);
    evalService = module.get(MailEvalService);
    templateService = module.get(MailTemplateService);
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

    expect(templateService.sendEmailRecord).toHaveBeenCalled();
  });
});
