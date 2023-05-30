import { Test, TestingModule } from '@nestjs/testing';
import { QaCertEventController } from './qa-cert-event.controller';
import { QaCertEventService } from './qa-cert-event.service';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { HttpModule } from '@nestjs/axios';
import { QaCertMaintParamsDto } from '../dto/qa-cert-maint-params.dto';
import { EntityManager } from 'typeorm';
import { QaCertEventMaintView } from '../entities/qa-cert-event-maint-vw.entity';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';

describe('QaCertEventController', () => {
  let controller: QaCertEventController;
  let service: QaCertEventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [QaCertEventController],
      providers: [QaCertEventService, ConfigService, EntityManager],
    }).compile();

    controller = module.get<QaCertEventController>(QaCertEventController);
    service = module.get<QaCertEventService>(QaCertEventService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return data for getQaCertEventViewData controller method', async () => {
    jest.spyOn(service, 'getQaCertEventViewData').mockResolvedValue([]);

    expect(
      await controller.getQaCertEventViewData(new QaCertMaintParamsDto()),
    ).toEqual([]);
  });

  it('should return data for updateSubmissionStatus controller method', async () => {
    const record = new QaCertEventMaintView();
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
