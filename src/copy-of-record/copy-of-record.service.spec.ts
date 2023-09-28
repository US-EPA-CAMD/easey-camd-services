import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { CopyOfRecordService } from './copy-of-record.service';
import { ReportDTO } from '../dto/report.dto';
import { ReportColumnDTO } from '../dto/report-column.dto';
import { ReportDetailDTO } from '../dto/report-detail.dto';
import { DataSetService } from '../dataset/dataset.service';

jest.mock('../dataset/dataset.service');

const report = new ReportDTO();

const columnDto = new ReportColumnDTO();
columnDto.code = 'FACINFO1C';
columnDto.values = [
  { name: 'facilityName', displayName: 'Facility Name' },
  { name: 'orisCode', displayName: 'Facility ID (ORISPL)' },
  { name: 'stateCode', displayName: 'State' },
  { name: 'countyName', displayName: 'County' },
  { name: 'latitude', displayName: 'Latitude' },
  { name: 'longitude', displayName: 'Longitude' },
];

const reportDto = new ReportDetailDTO();
reportDto.displayName = 'Mock Facility Table';
reportDto.templateCode = 'FACINFO1C';
reportDto.templateType = '1COLTBL';
reportDto.results = [
  {
    facilityName: 'Cholla',
    orisCode: '113',
    stateCode: 'AZ',
    countyName: 'Navajo County',
    latitude: '34.9394',
    longitude: '-110.3033',
  },
];

report.columns = [columnDto];
report.details = [reportDto];

describe('-- Copy of Record Service --', () => {
  let service: CopyOfRecordService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      controllers: [],
      providers: [CopyOfRecordService, DataSetService],
    }).compile();

    service = module.get(CopyOfRecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add document header correctly', () => {
    let str = '{HEADER}';
    str = service.addDocumentHeader(str, 'Title');

    expect(str).toBe('Title');
  });

  it('should add table header correctly', () => {
    const header = service.addTableHeader('Header');

    expect(header).toBe('<h2> Header </h2>');
  });

  it('should add a column table correctly', () => {
    const content = service.addColTable(
      columnDto,
      reportDto.results,
      'Display',
      1,
    );

    expect(content).toEqual(
      `<h2> Display </h2><div class = \"col-table-container\"><table class=\"col-table\"><tr><th>Facility Name</th><td>Cholla</td></tr><tr><th>Facility ID (ORISPL)</th><td>113</td></tr><tr><th>State</th><td>AZ</td></tr><tr><th>County</th><td>Navajo County</td></tr><tr><th>Latitude</th><td>34.9394</td></tr><tr><th>Longitude</th><td>-110.3033</td></tr></table></div>`,
    );
  });

  it('should add a default table correctly', () => {
    const content = service.addDefaultTable(
      columnDto,
      reportDto.results,
      'Display',
      false,
    );

    expect(content).toEqual(
      `<h2> Display </h2><div> <table><tr><th> Facility Name </th><th> Facility ID (ORISPL) </th><th> State </th><th> County </th><th> Latitude </th><th> Longitude </th></tr><tr><td> Cholla </td><td> 113 </td><td> AZ </td><td> Navajo County </td><td> 34.9394 </td><td> -110.3033 </td></tr></table> </div>`,
    );
  });

  it('should add a default table correctly', () => {
    expect(() => {
      service.generateCopyOfRecord(report);
    }).not.toThrowError();
  });
});
