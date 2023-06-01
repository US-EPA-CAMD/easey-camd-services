import { Test, TestingModule } from '@nestjs/testing';
import { QaTestDataController } from './qa-test-data.controller';
import { QaTestDataService } from './qa-test-data.service';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('QaTestDataController', () => {
  let controller: QaTestDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [QaTestDataController],
      providers: [QaTestDataService, ConfigService],
    }).compile();

    controller = module.get<QaTestDataController>(QaTestDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
