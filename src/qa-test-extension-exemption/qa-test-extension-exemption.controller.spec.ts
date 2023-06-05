import { Test, TestingModule } from '@nestjs/testing';
import { QaTestExtensionExemptionController } from './qa-test-extension-exemption.controller';
import { QaTestExtensionExemptionService } from './qa-test-extension-exemption.service';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { ConfigService } from '@nestjs/config';
import { QaCertMaintParamsDto } from '../dto/qa-cert-maint-params.dto';
import { EntityManager } from 'typeorm';
import { QaTeeMaintView } from '../entities/qa-tee-maint-vw.entity';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';

describe('QaTestExtensionExemptionController', () => {
  let controller: QaTestExtensionExemptionController;
  let service: QaTestExtensionExemptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, LoggerModule],
      controllers: [QaTestExtensionExemptionController],
      providers: [
        QaTestExtensionExemptionService,
        ConfigService,
        EntityManager,
      ],
    }).compile();

    controller = module.get<QaTestExtensionExemptionController>(
      QaTestExtensionExemptionController,
    );

    service = module.get<QaTestExtensionExemptionService>(
      QaTestExtensionExemptionService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return data for getQaTeeViewData controller method', async () => {
    jest.spyOn(service, 'getQaTeeViewData').mockResolvedValue([]);

    expect(
      await controller.getQaTeeViewData(new QaCertMaintParamsDto()),
    ).toEqual([]);
  });

  it('should return data for updateSubmissionStatus controller method', async () => {
    const record = new QaTeeMaintView();
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
