import { ConfigService } from '@nestjs/config';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { HttpModule } from '@nestjs/axios';
import { EntityManager } from 'typeorm';
import { EmSubmissionAccessService } from './em-submission-access.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
  EmSubmissionAccessCreateDTO,
  EmSubmissionAccessDTO,
  EmSubmissionAccessUpdateDTO,
} from '../dto/em-submission-access.dto';
import { EmSubmissionAccessParamsDTO } from '../dto/em-submission-access.params.dto';
import { EmSubmissionAccessMap } from '../maps/em-submission-access.map';
import { EmSubmissionAccessViewRepository } from './em-submission-access-view.repository';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';
import { EmSubmissionAccessRepository } from './em-submission-access.repository';
import { genEmSubmissionAccess } from '../../test/object-generators/em-submission-access';
import { EmSubmissionAccessController } from './em-submission-access.controller';

describe('EmSubmissionAccessController', () => {
  let controller: EmSubmissionAccessController;
  let service: EmSubmissionAccessService;
  const currentUser: CurrentUser = {
    userId: '',
    sessionId: '',
    expiration: '',
    clientIp: '',
    facilities: [],
    roles: [],
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [EmSubmissionAccessController],
      providers: [
        EmSubmissionAccessService,
        EmSubmissionAccessMap,
        EmSubmissionAccessViewRepository,
        EmSubmissionAccessRepository,
        ConfigService,
        EntityManager,
      ],
    }).compile();

    controller = module.get<EmSubmissionAccessController>(
      EmSubmissionAccessController,
    );
    service = module.get<EmSubmissionAccessService>(EmSubmissionAccessService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return data for getEmSubmissionAccess controller method', async () => {
    const paramsDto = new EmSubmissionAccessParamsDTO();
    const mockedValues = new EmSubmissionAccessDTO();
    jest
      .spyOn(service, 'getEmSubmissionAccess')
      .mockResolvedValue([mockedValues]);

    expect(await controller.getEmSubmissionAccess(paramsDto)).toEqual([
      mockedValues,
    ]);
  });

  it('calls EmSubmissionAccessService.createEmSubmissionAccess() and creates an Emission Submission Access record', async () => {
    const mockedValue = genEmSubmissionAccess<EmSubmissionAccessDTO>()[0];
    const payload = new EmSubmissionAccessCreateDTO();
    jest
      .spyOn(service, 'createEmSubmissionAccess')
      .mockResolvedValue(mockedValue);
    expect(
      await controller.createEmSubmissionAccess(payload, currentUser),
    ).toBe(mockedValue);
  });

  it('calls EmSubmissionAccessService.updateEmSubmissionAccess() and updates an Emission Submission Access record', async () => {
    const mockedValue = genEmSubmissionAccess<EmSubmissionAccessDTO>()[0];
    const payload = new EmSubmissionAccessUpdateDTO();
    jest
      .spyOn(service, 'updateEmSubmissionAccess')
      .mockResolvedValue(mockedValue);
    expect(await controller.updateEmSubmissionAccess(123, payload)).toBe(
      mockedValue,
    );
  });
});
