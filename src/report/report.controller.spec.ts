import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';

import { ReportRepository } from './report.repository';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportDTO } from '../dto/report.dto';
import { ReportParamsDTO } from '../dto/report-params.dto';

describe('-- Report Controller --', () => {
  let controller: ReportController;
  let service: ReportService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      controllers: [ReportController],
      providers: [
        ReportService,
        ReportRepository,
      ],
    }).compile();

    controller = module.get(ReportController);
    service = module.get(ReportService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', async () => {
    expect(controller).toBeDefined();
  });

  describe('* getReport', () => {
    it('should return a single Report', async () => {
      const expectedResult = new ReportDTO();
      const paramsDto = new ReportParamsDTO();
      jest.spyOn(service, 'getReport').mockResolvedValue(expectedResult);
      expect(await controller.getReport(paramsDto)).toBe(expectedResult);
    });
  });
});
