import { Test } from '@nestjs/testing';

import { DataSetService } from '../dataset/dataset.service';
import { ReportController } from './report.controller';
import { DataSetRepository } from '../dataset/dataset.repository';

import { ReportDTO } from '../dto/report.dto';
import { ReportParamsDTO } from '../dto/report-params.dto';

describe('-- Report Controller --', () => {
  let controller: ReportController;
  let service: DataSetService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [DataSetService, DataSetRepository],
    }).compile();

    controller = module.get(ReportController);
    service = module.get(DataSetService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  describe('* getReport', () => {
    it('should return a single Report', async () => {
      const expectedResult = new ReportDTO();
      const paramsDto = new ReportParamsDTO();
      jest.spyOn(service, 'getDataSet').mockResolvedValue(expectedResult);
      expect(await controller.getReport(paramsDto)).toBe(expectedResult);
    });
  });
});
