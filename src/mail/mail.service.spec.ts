import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { CreateMailDto } from '../dto/create-mail.dto';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({ sendMail: jest.fn() }),
}));

describe('Mail Service', () => {
  let service: MailService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [MailService, ConfigService],
    }).compile();

    service = module.get(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call the service to send an email given a valid DTO', () => {
    expect(() => {
      service.sendEmail(new CreateMailDto());
    }).not.toThrowError();
  });
});
