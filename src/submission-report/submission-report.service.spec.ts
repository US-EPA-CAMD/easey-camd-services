import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionReportService } from './submission-report.service';
import { SubmissionReportParamsDTO } from '../dto/submission-report-params.dto';
import { SubmissionReportDTO } from '../dto/submission-report.dto';
import { SubmissionListViewRepository } from './submission-report-view.repository';
import { SubmissionListMap } from '../maps/submission-list.map';
import { genSubmissionList } from '../../test/object-generators/submisison-report-list';

const mockViewRepository = () => ({
  getSubmissionReportList: jest.fn(),
  findOneBy: jest.fn(),
});

const mockMap = () => ({
  many: jest.fn(),
  one: jest.fn(),
});

describe('SubmissionReportService', () => {
  let service: SubmissionReportService;
  let viewRepository: any;
  let map: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionReportService,
        {
          provide: SubmissionListViewRepository,
          useFactory: mockViewRepository,
        },
        {
          provide: SubmissionListMap,
          useFactory: mockMap,
        },
      ],
    }).compile();

    service = module.get(SubmissionReportService);
    viewRepository = module.get<SubmissionListViewRepository>(SubmissionListViewRepository);
    map = module.get(SubmissionListMap);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully return data only from SubmissionListViewRepository', async () => {
    const mockedViewRecords = genSubmissionList<SubmissionReportDTO>();
    map.many.mockReturnValue(mockedViewRecords);
    viewRepository.getSubmissionReportList.mockResolvedValue([]);

    let filters = new SubmissionReportParamsDTO();
    filters.orisCode = null;
    filters.year = null;
    filters.quarter = null;
    filters.severityCode = null;
    filters.severityCode = null;
    filters.submissionFrom = null;
    filters.submissionTo = null;

    let result = await service.getSubmissionReport(filters);

    expect(result).toEqual(mockedViewRecords);
    expect(viewRepository.getSubmissionReportList).toHaveBeenCalledWith(filters);
  });

});
