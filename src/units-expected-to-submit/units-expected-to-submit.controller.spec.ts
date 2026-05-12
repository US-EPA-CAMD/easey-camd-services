import { ConfigService } from '@nestjs/config';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { HttpModule } from '@nestjs/axios';
import { DataSource, EntityManager } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { UnitsExpectedToSubmitService } from './units-expected-to-submit.service';
import { UnitsExpectedParamsDTO } from '../dto/units-expected-params.dto';
import { UnitsExpectedDTO } from '../dto/units-expected.dto';
import { UnitsExpectedToSubmitController } from './units-expected-to-submit.controller';
import { UnitsExpectedRepository } from './units-expected-to-submit.repository';
import { UnitsExpectedMap } from '../maps/units-expected.map';

describe('UnitsExpectedToSubmitController', () => {
  let controller: UnitsExpectedToSubmitController;
  let service: UnitsExpectedToSubmitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [UnitsExpectedToSubmitController],
      providers: [
        UnitsExpectedToSubmitService,
        UnitsExpectedMap,
        UnitsExpectedRepository,
        ConfigService,
        EntityManager,
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<UnitsExpectedToSubmitController>(
      UnitsExpectedToSubmitController,
    );
    service = module.get<UnitsExpectedToSubmitService>(UnitsExpectedToSubmitService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('Retrieves Units Expected to Submit Report per filter criteria', async () => {
    const paramsDto = new UnitsExpectedParamsDTO();
    paramsDto.programCode = 'ARP';
    paramsDto.year = 2023;
    paramsDto.quarter = 1;
    
    const mockedValues = new UnitsExpectedDTO();
    jest
      .spyOn(service, 'getUnitsExpectedToSubmit')
      .mockResolvedValue([mockedValues]);

    expect(await controller.getUnitsExpectedToSubmit(paramsDto)).toEqual({
      items: [mockedValues],
    });
  });

  it('handles empty results correctly', async () => {
    const paramsDto = new UnitsExpectedParamsDTO();
    paramsDto.programCode = 'ARP';
    paramsDto.year = 2023;
    paramsDto.quarter = 1;
    
    jest
      .spyOn(service, 'getUnitsExpectedToSubmit')
      .mockResolvedValue([]);

    expect(await controller.getUnitsExpectedToSubmit(paramsDto)).toEqual({
      items: [],
    });
  });
});