import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { MailController } from './mail.controller';
import {
  MailerModule,
  MailerService,
  MAILER_OPTIONS,
} from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

describe('Mail Controller', () => {
  let controller: MailController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, MailerModule],
      controllers: [MailController],
      providers: [
        MailService,
        MailerService,
        {
          name: MAILER_OPTIONS,
          provide: MAILER_OPTIONS,
          useValue: { transport: { url: '' } },
        },
      ],
    }).compile();

    controller = module.get(MailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
