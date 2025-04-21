import { ConfigService } from '@nestjs/config';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { HttpModule } from '@nestjs/axios';
import { DataSource, EntityManager } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { SubmissionReportService } from './submission-report.service';
import { SubmissionReportParamsDTO } from '../dto/submission-report-params.dto';
import { SubmissionReportDTO } from '../dto/submission-report.dto';
import { SubmissionReportController } from './submission-report.controller'
import { SubmissionListViewRepository } from './submission-report-view.repository';
import { SubmissionListMap } from '../maps/submission-list.map';

describe('SubmissionReportController', () => {
  let controller: SubmissionReportController;
  let service: SubmissionReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [SubmissionReportController],
      providers: [
        SubmissionReportService,
        SubmissionListMap,
        SubmissionListViewRepository,
        ConfigService,
        EntityManager,
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<SubmissionReportController>(
        SubmissionReportController,
    );
    service = module.get<SubmissionReportService>(SubmissionReportService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('Retrieves Submission Report (CAT) per filter criteria', async () => {
    const paramsDto = new SubmissionReportParamsDTO();
    const mockedValues = new SubmissionReportDTO();
    jest
      .spyOn(service, 'getSubmissionReport')
      .mockResolvedValue([mockedValues]);

    expect(await controller.getSubmissionReport(paramsDto)).toEqual({
      items: [mockedValues],
    });
  });

});
