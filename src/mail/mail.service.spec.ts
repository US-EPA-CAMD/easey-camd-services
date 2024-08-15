import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { ClientConfig } from '../entities/client-config.entity';
import { CreateMailDto } from '../dto/create-mail.dto';
import { MailService } from './mail.service';
import { HttpModule } from '@nestjs/axios';
import { EntityManager } from 'typeorm';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({ sendMail: jest.fn() }),
}));

describe('Mail Service', () => {
  let service: MailService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      providers: [EntityManager, MailService, ConfigService],
    }).compile();

    service = module.get(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call the service to send an email given a valid DTO', () => {
    const mockApiRecord = new ClientConfig();
    mockApiRecord.name = 'camd-ui';

    jest.spyOn(service, 'returnManager').mockReturnValue(
      createMock<EntityManager>({
        findOne: jest.fn().mockReturnValue(mockApiRecord),
      }),
    );

    expect(() => {
      service.sendEmail('', new CreateMailDto());
    }).not.toThrowError();
  });
});
