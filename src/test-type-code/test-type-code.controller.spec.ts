import { ConfigService } from '@nestjs/config';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { HttpModule } from '@nestjs/axios';
import { DataSource, EntityManager } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { TestTypeCodeService } from './test-type-code.service';
import { TestTypeCode } from '../entities/test-type-code.entity';
import { TestTypeCodeController } from './test-type-code.controller';

describe('TestTypeCodeController', () => {
  let controller: TestTypeCodeController;
  let service: TestTypeCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [TestTypeCodeController],
      providers: [
        TestTypeCodeService,
        ConfigService,
        EntityManager,
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<TestTypeCodeController>(
        TestTypeCodeController,
    );
    service = module.get<TestTypeCodeService>(TestTypeCodeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('Retrieves All Test Type Code', async () => {
    const mockedValues = new TestTypeCode();
    jest
      .spyOn(service, 'findAll')
      .mockResolvedValue([mockedValues]);

    expect(await controller.findAll()).toEqual({
      items: [mockedValues],
    });
  });

});
