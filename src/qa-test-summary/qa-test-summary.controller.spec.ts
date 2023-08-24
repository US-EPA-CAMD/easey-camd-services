import { Test, TestingModule } from '@nestjs/testing';
import { QaTestSummaryController } from './qa-test-summary.controller';
import { QaTestSummaryService } from './qa-test-summary.service';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { QaCertMaintParamsDto } from '../dto/qa-cert-maint-params.dto';
import { EntityManager } from 'typeorm';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';
import { QaUpdateDto } from '../dto/qa-update.dto';
import { QaTestSummaryMaintMap } from '../maps/qa-test-summary-maint.map';
import { QaTestSummaryMaintViewDTO } from '../dto/qa-test-summary-maint-vw.dto';

describe('QaTestSummaryController', () => {
  let controller: QaTestSummaryController;
  let service: QaTestSummaryService;
  let updatePayload;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [QaTestSummaryController],
      providers: [
        QaTestSummaryService,
        ConfigService,
        EntityManager,
        QaTestSummaryMaintMap,
      ],
    }).compile();

    controller = module.get<QaTestSummaryController>(QaTestSummaryController);
    service = module.get<QaTestSummaryService>(QaTestSummaryService);
    updatePayload = new QaUpdateDto();
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
    const record = new QaTestSummaryMaintViewDTO();
    const user: CurrentUser = {
      userId: 'testUser',
      sessionId: '',
      expiration: '',
      clientIp: '',
      facilities: [],
      roles: [],
    };
    jest.spyOn(service, 'updateSubmissionStatus').mockResolvedValue(record);

    expect(
      await controller.updateSubmissionStatus('id', user, updatePayload),
    ).toEqual(record);
  });

  it('should return data for deleteQATestSummaryData controller method', async () => {
    jest.spyOn(service, 'deleteQATestSummaryData').mockResolvedValue('');

    expect(await controller.deleteQATestSummaryData('id')).toEqual('');
  });
});
