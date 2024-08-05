import { Test } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { DataSetService } from '../dataset/dataset.service';
import { ReportDTO } from '../dto/report.dto';
import { ReportColumnDTO } from '../dto/report-column.dto';
import { ReportDetailDTO } from '../dto/report-detail.dto';
import { submissionFeedbackTemplate } from './submission-feedback-template';
import { KeyValuePairs, SubmissionEmailParamsDto } from '../dto/submission-email-params.dto';
import { SubmissionFeedbackRecordService } from './submission-feedback-record.service';

describe('-- Submission Feedback Record Service --', () => {
  let service: SubmissionFeedbackRecordService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        SubmissionFeedbackRecordService,
        EntityManager,
        {
          provide: DataSetService,
          useFactory: () => ({
            getDataSet: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get(SubmissionFeedbackRecordService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create submission feedback email attachment', () => {
    const submissionEmailParamsDto = new SubmissionEmailParamsDto();
    submissionEmailParamsDto.templateContext = {
      monitorPlan: {
        item: {
          facilityName: 'Test Facility',
          orisCode: '12345',
          unitStackPipe: 'USP001',
          submissionDateDisplay: '2022-01-01',
          stateCode: 'TX',
        },
      },
    };

    const result = service.createSubmissionFeedbackEmailAttachment(submissionEmailParamsDto);
    expect(result).toContain('Test Facility');
    expect(result).toContain('12345');
    expect(result).toContain('USP001');
    expect(result).toContain('2022-01-01');
    expect(result).toContain('TX');
  });

  it('should replace attachment header contents', () => {
    const content = submissionFeedbackTemplate;
    const submissionEmailParamsDto = new SubmissionEmailParamsDto();
    submissionEmailParamsDto.templateContext = {
      monitorPlan: {
        item: {
          facilityName: 'Test Facility',
          orisCode: '12345',
          unitStackPipe: 'USP001',
          submissionDateDisplay: '2022-01-01',
          stateCode: 'TX',
        },
      },
    };

    const result = service.replaceAttachmentHeaderContents(content, submissionEmailParamsDto);
    expect(result).toContain('Test Facility');
    expect(result).toContain('12345');
    expect(result).toContain('USP001');
    expect(result).toContain('2022-01-01');
    expect(result).toContain('TX');
  });

  it('should generate summary table for unit stack', () => {
    const reportDTO = new ReportDTO();
    reportDTO.details = [
      {
        templateCode: 'templateCode1',
        templateType: 'templateType1',
        results: [{ column1: 'value1', column2: 'value2' }],
      },
    ] as ReportDetailDTO[];
    reportDTO.columns = [
      {
        code: 'templateCode1',
        values: [
          { name: 'column1', displayName: 'Column 1' },
          { name: 'column2', displayName: 'Column 2' },
        ],
      },
    ] as ReportColumnDTO[];

    const result = service.generateSummaryTableForUnitStack(reportDTO, 'USP001');
    expect(result).toContain('Unit/Stack/Pipe ID: USP001');
    expect(result).toContain('<th> Column 1 </th>');
    expect(result).toContain('<th> Column 2 </th>');
    expect(result).toContain('<td> value1 </td>');
    expect(result).toContain('<td> value2 </td>');
  });

  it('should add default table', () => {
    const columns = {
      values: [
        { name: 'column1', displayName: 'Column 1' },
        { name: 'column2', displayName: 'Column 2' },
      ],
    } as ReportColumnDTO;
    const detail = {
      results: [{ column1: 'value1', column2: 'value2' }],
    } as ReportDetailDTO;

    const result = service.addDefaultTable(columns, detail, 'USP001');
    expect(result).toContain('Unit/Stack/Pipe ID: USP001');
    expect(result).toContain('<th> Column 1 </th>');
    expect(result).toContain('<th> Column 2 </th>');
    expect(result).toContain('<td> value1 </td>');
    expect(result).toContain('<td> value2 </td>');
  });

  it('should add table header', () => {
    const result = service.addTableHeader('USP001');
    expect(result).toContain('Unit/Stack/Pipe ID: USP001');
  });

  it('should get submission receipt table content', () => {
    const pairs: KeyValuePairs = {
      'Key 1': 'Value 1',
      'Key 2': 'Value 2',
    };

    const result = service.getSubmissionReceiptTableContent(pairs);
    expect(result).toContain('<td>Key 1</td>');
    expect(result).toContain('<td>Value 1</td>');
    expect(result).toContain('<td>Key 2</td>');
    expect(result).toContain('<td>Value 2</td>');
  });
});
