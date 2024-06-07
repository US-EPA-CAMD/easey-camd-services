import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { EntityManager } from 'typeorm';

import { LoggingController } from './logging.controller';
import { LoggingService } from './logging.service';

describe('-- Logging Controller --', () => {
  let controller: LoggingController;
  let service: LoggingService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [LoggingController],
      providers: [ConfigService, EntityManager, LoggingService],
    }).compile();

    controller = module.get(LoggingController);
    service = module.get(LoggingService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', async () => {
    expect(controller).toBeDefined();
  });

  describe('serverError', () => {
    it('should log a server error', async () => {
      jest.spyOn(service, 'logServerError').mockResolvedValue();
      await controller.serverError(null, null);
      expect(service.logServerError).toHaveBeenCalled();
    });
  });
});
