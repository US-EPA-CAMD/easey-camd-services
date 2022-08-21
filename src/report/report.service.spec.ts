import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';

import { ReportService } from './Report.service';
import { ReportRepository } from './Report.repository';
import { ReportMap } from '../maps/report.map';
import { ReportDetailMap } from '../maps/report-detail.map';
import { ReportColumnMap } from '../maps/report-column.map';
import { ReportParameterMap } from '../maps/report-parameter.map';
import { ReportParamsDTO } from '../dto/report-params.dto';
import { ReportDTO } from '../dto/report.dto';

const mockRepository = () => ({
  getReport: jest.fn(),
});

describe('-- Report Service --', () => {
  let service: ReportService;
  let repository: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        ReportMap,
        ReportDetailMap,
        ReportColumnMap,
        ReportParameterMap,
        ReportService,
        {
          provide: ReportRepository,
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get(ReportService);
    repository = module.get(ReportRepository);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  describe('getReport', () => {
    it('calls ReportRepository.getReport() and gets Report based on params', async () => {
    });
  });
});
