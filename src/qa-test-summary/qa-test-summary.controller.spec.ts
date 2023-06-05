import { Test, TestingModule } from '@nestjs/testing';
import { QaTestSummaryController } from './qa-test-summary.controller';
import { QaTestSummaryService } from './qa-test-summary.service';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { QaCertMaintParamsDto } from '../dto/qa-cert-maint-params.dto';
import { EntityManager } from 'typeorm';
import { QaTestSummaryMaintView } from '../entities/qa-test-summary-maint-vw.entity';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';

describe('QaTestSummaryController', () => {
  let controller: QaTestSummaryController;
  let service: QaTestSummaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [QaTestSummaryController],
      providers: [QaTestSummaryService, ConfigService, EntityManager],
    }).compile();

    controller = module.get<QaTestSummaryController>(QaTestSummaryController);
    service = module.get<QaTestSummaryService>(QaTestSummaryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return data for getQaTestSummaryViewData controller method', async () => {
    jest.spyOn(service, 'getQaTestSummaryViewData').mockResolvedValue([]);

    expect(
      await controller.getQaTestSummaryViewData(new QaCertMaintParamsDto()),
    ).toEqual([]);
  });

  it('should return data for updateSubmissionStatus controller method', async () => {
    const record = new QaTestSummaryMaintView();
    const user: CurrentUser = {
      userId: 'testUser',
      sessionId: '',
      expiration: '',
      clientIp: '',
      facilities: [],
      roles: [],
    };
    jest.spyOn(service, 'updateSubmissionStatus').mockResolvedValue(record);

    expect(await controller.updateSubmissionStatus('id', user)).toEqual(record);
  });
});
