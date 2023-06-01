import { Test, TestingModule } from '@nestjs/testing';
import { QaCertEventController } from './qa-cert-event.controller';
import { QaCertEventService } from './qa-cert-event.service';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { HttpModule } from '@nestjs/axios';

describe('QaCertEventController', () => {
  let controller: QaCertEventController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports:[LoggerModule, HttpModule],
      controllers: [QaCertEventController],
      providers: [QaCertEventService, ConfigService],
    }).compile();

    controller = module.get<QaCertEventController>(QaCertEventController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
