import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';

import { ServerErrorDto } from '../dto/server-error.dto';
import { LoggingService } from './logging.service';

describe('-- Logging Controller --', () => {
  let service: LoggingService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      controllers: [],
      providers: [ConfigService, EntityManager, LoggingService],
    }).compile();

    service = module.get(LoggingService);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  describe('logServerError', () => {
    it('should log a server error', async () => {
      const request = createMock<Request>();
      request.headers['x-client-id'] = '';

      const mockedManager = {
        findOneBy: jest.fn().mockResolvedValue({ apiRecord: '' }),
      };

      jest.spyOn(service, 'returnManager').mockImplementation(() => {
        return mockedManager as any;
      });

      const errorDto = new ServerErrorDto();
      errorDto.errorId = '';
      errorDto.message = '';
      errorDto.stackTrace = '';

      await service.logServerError(request, errorDto);

      expect(mockedManager.findOneBy).toHaveBeenCalled();
    });
  });
});
