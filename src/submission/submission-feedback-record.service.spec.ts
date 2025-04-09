import { Test } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { DataSetService } from '../dataset/dataset.service';
import { ReportDTO } from '../dto/report.dto';
import { ReportColumnDTO } from '../dto/report-column.dto';
import { ReportDetailDTO } from '../dto/report-detail.dto';
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

  describe('isResubmissionRequired', () => {
    it('should return true for CRIT1 severity code', () => {
      // Create a mock HighestSeverityRecord with CRIT1 severity code
      const highestSeverityRecord = {
        submissionQueue: { severityCode: 'CRIT1' },
        severityCode: { severityCode: 'CRIT1' }
      };

      // Call the private method using any type assertion
      const result = (service as any).isResubmissionRequired(highestSeverityRecord);

      // Verify that the result is true
      expect(result).toBe(true);
    });

    it('should return true for FATAL severity code', () => {
      // Create a mock HighestSeverityRecord with FATAL severity code
      const highestSeverityRecord = {
        submissionQueue: { severityCode: 'FATAL' },
        severityCode: { severityCode: 'FATAL' }
      };

      // Call the private method using any type assertion
      const result = (service as any).isResubmissionRequired(highestSeverityRecord);

      // Verify that the result is true
      expect(result).toBe(true);
    });

    it('should return false for CRIT2 severity code', () => {
      // Create a mock HighestSeverityRecord with CRIT2 severity code
      const highestSeverityRecord = {
        submissionQueue: { severityCode: 'CRIT2' },
        severityCode: { severityCode: 'CRIT2' }
      };

      // Call the private method using any type assertion
      const result = (service as any).isResubmissionRequired(highestSeverityRecord);

      // Verify that the result is false
      expect(result).toBe(false);
    });

    it('should return false for CRIT3 severity code', () => {
      // Create a mock HighestSeverityRecord with CRIT3 severity code
      const highestSeverityRecord = {
        submissionQueue: { severityCode: 'CRIT3' },
        severityCode: { severityCode: 'CRIT3' }
      };

      // Call the private method using any type assertion
      const result = (service as any).isResubmissionRequired(highestSeverityRecord);

      // Verify that the result is false
      expect(result).toBe(false);
    });

    it('should return false for null or undefined severity code', () => {
      // Create a mock HighestSeverityRecord with null severity code
      const nullSeverityRecord = {
        submissionQueue: { severityCode: null },
        severityCode: null
      };

      // Call the private method using any type assertion
      const resultNull = (service as any).isResubmissionRequired(nullSeverityRecord);

      // Verify that the result is false
      expect(resultNull).toBe(false);

      // Create a mock HighestSeverityRecord with undefined severity code
      const undefinedSeverityRecord = undefined;

      // Call the private method using any type assertion
      const resultUndefined = (service as any).isResubmissionRequired(undefinedSeverityRecord);

      // Verify that the result is false
      expect(resultUndefined).toBe(false);
    });
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
    expect(result).toContain('<th>Column 1</th>');
    expect(result).toContain('<th>Column 2</th>');
    expect(result).toContain('<td>value1</td>');
    expect(result).toContain('<td>value2</td>');
  });

  it('should add default table to report', () => {
    const columns = {
      values: [
        { name: 'column1', displayName: 'Column 1' },
        { name: 'column2', displayName: 'Column 2' },
      ],
    } as ReportColumnDTO;
    const detail = {
      results: [{ column1: 'value1', column2: 'value2' }],
    } as ReportDetailDTO;

    const result = service.addTable(columns, detail, 'Unit/Stack/Pipe ID: USP001');
    expect(result).toContain('Unit/Stack/Pipe ID: USP001');
    expect(result).toContain('<th>Column 1</th>');
    expect(result).toContain('<th>Column 2</th>');
    expect(result).toContain('<td>value1</td>');
    expect(result).toContain('<td>value2</td>');
  });
});
