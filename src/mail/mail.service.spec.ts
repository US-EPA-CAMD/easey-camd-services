import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { Api } from '../entities/api.entity';
import { CreateMailDto } from '../dto/create-mail.dto';
import { MailService } from './mail.service';
import { HttpModule } from '@nestjs/axios';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({ sendMail: jest.fn() }),
}));

describe('Mail Service', () => {
  let service: MailService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      providers: [MailService, ConfigService],
    }).compile();

    service = module.get(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call the service to send an email given a valid DTO', () => {
    const mockApiRecord = new Api();
    mockApiRecord.name = 'camd-ui';

    jest.spyOn(service, 'returnManager').mockReturnValue({
      findOne: jest.fn().mockReturnValue(mockApiRecord),
    });

    expect(() => {
      service.sendEmail(createMock<Request>(), new CreateMailDto());
    }).not.toThrowError();
  });
});
