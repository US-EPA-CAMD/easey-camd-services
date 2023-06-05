import { ConfigService } from '@nestjs/config';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { HttpModule } from '@nestjs/axios';
import { EntityManager } from 'typeorm';
import { EmSubmissionAccessController } from './em-submission-access.controller';
import { EmSubmissionAccessService } from './em-submission-access.service';
import { Test, TestingModule } from '@nestjs/testing';
import { EmSubmissionAccessDTO } from '../dto/em-submission-access.dto';
import { EmSubmissionAccessParamsDTO } from '../dto/em-submission-access.params.dto';
import { EmSubmissionAccessMap } from '../maps/em-submission-access.map';
import { EmSubmissionAccessRepository } from './em-submission-access.repository';

describe('EmSubmissionAccessController', () => {
  let controller: EmSubmissionAccessController;
  let service: EmSubmissionAccessService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [EmSubmissionAccessController],
      providers: [
        EmSubmissionAccessService,
        EmSubmissionAccessMap,
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
});
