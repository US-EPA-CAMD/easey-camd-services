import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { DataSource, EntityManager } from 'typeorm';

import { QaCertEventMaintViewDTO } from '../dto/qa-cert-event-maint-vw.dto';
import { QaCertMaintParamsDto } from '../dto/qa-cert-maint-params.dto';
import { QaUpdateDto } from '../dto/qa-update.dto';
import { QaCertEventMaintMap } from '../maps/qa-cert-event-maint.map';
import { QaCertEventController } from './qa-cert-event.controller';
import { QaCertEventService } from './qa-cert-event.service';

describe('QaCertEventController', () => {
  let controller: QaCertEventController;
  let service: QaCertEventService;
  let updatePayload;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [QaCertEventController],
      providers: [
        QaCertEventService,
        ConfigService,
        {
          provide: DataSource,
          useValue: {},
        },
        EntityManager,
        QaCertEventMaintMap,
      ],
    }).compile();

    controller = module.get<QaCertEventController>(QaCertEventController);
    service = module.get<QaCertEventService>(QaCertEventService);
    updatePayload = new QaUpdateDto();
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
    const record = new QaCertEventMaintViewDTO();
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

  it('should return data for deleteQACertEventData controller method', async () => {
    jest.spyOn(service, 'deleteQACertEventData').mockResolvedValue('');

    expect(await controller.deleteQACertEventData('id')).toEqual('');
  });
});
