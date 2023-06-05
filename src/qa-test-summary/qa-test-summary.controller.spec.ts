import { Test, TestingModule } from '@nestjs/testing';
import { QaTestSummaryController } from './qa-test-summary.controller';
import { QaTestSummaryService } from './qa-test-summary.service';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { QaCertMaintParamsDto } from '../dto/qa-cert-maint-params.dto';

describe('QaTestSummaryController', () => {
  let controller: QaTestSummaryController;
  let service: QaTestSummaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [QaTestSummaryController],
      providers: [QaTestSummaryService, ConfigService],
    }).compile();

    controller = module.get<QaTestSummaryController>(QaTestSummaryController);
    service = module.get<QaTestSummaryService>(QaTestSummaryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return data for GET method', async ()=>{
    jest.spyOn(service, 'getQaTestSummaryData').mockResolvedValue([]);

    expect(await controller.getQaTestSummaryData(new QaCertMaintParamsDto)).toEqual([])
  })
});
