import { Test, TestingModule } from '@nestjs/testing';
import { QaTestSummaryController } from './qa-test-summary.controller';
import { QaTestSummaryService } from './qa-test-summary.service';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('QaTestSummaryController', () => {
  let controller: QaTestSummaryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [QaTestSummaryController],
      providers: [QaTestSummaryService, ConfigService],
    }).compile();

    controller = module.get<QaTestSummaryController>(QaTestSummaryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
