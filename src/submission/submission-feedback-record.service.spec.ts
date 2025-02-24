import { Test } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { DataSetService } from '../dataset/dataset.service';
import { ReportDTO } from '../dto/report.dto';
import { ReportColumnDTO } from '../dto/report-column.dto';
import { ReportDetailDTO } from '../dto/report-detail.dto';
import { SubmissionFeedbackRecordService } from './submission-feedback-record.service';
import { SubmissionEmailParamsDto, HighestSeverityRecord } from '../dto/submission-email-params.dto';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import { SeverityCode } from '../entities/severity-code.entity';

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
    it('should require resubmission for CRIT1 errors', async () => {
      const submissionEmailParamsDto = {
        orisCode: 123,
        facilityName: 'Test Facility',
        stateCode: 'TX',
        submissionSet: {
          monPlanIdentifier: 'TEST-123',
          userEmail: 'test@example.com',
          facIdentifier: 1,
          orisCode: 123,
          facName: 'Test Facility',
          configuration: 'Test Config',
          queuedTime: new Date(),
          userIdentifier: 'testUser',
          submissionSetIdentifier: 'test-id',
          statusCode: 'QUEUED',
          note: null,
          noteTime: null
        },
        submissionQueueRecords: [],
        monLocationIds: 'LOC1,LOC2',
        facId: 1,
        unitStackPipe: 'UNIT1',
        monPlanStatus: 'Active',
        toEmail: 'test@example.com',
        ccEmail: null,
        fromEmail: 'system@example.com',
        processCode: 'TEST',
        rptPeriod: null,
        epaAnalystLink: null,
        highestSeverityRecord: {
          submissionQueue: {
            severityCode: 'CRIT1',
            submissionSetIdentifier: 'test-id',
            processCode: 'TEST',
            statusCode: 'QUEUED',
            queuedTime: new Date()
          } as SubmissionQueue,
          severityCode: {
            severityCode: 'CRIT1',
            severityCodeDescription: 'Critical Error Level 1',
            severityLevel: 1,
            esTypeInd: 0,
            evalStatusCode: null
          } as SeverityCode
        }
      };
      const result = await service.getSubmissionReceiptData(submissionEmailParamsDto as any);
      const resubmissionRequired = result.find(pair => pair.key === 'Resubmission Required');
      expect(resubmissionRequired.value).toBe('Yes');
    });

    it('should not require resubmission for CRIT2 errors', async () => {
      const submissionEmailParamsDto = {
        orisCode: 123,
        facilityName: 'Test Facility',
        stateCode: 'TX',
        submissionSet: {
          monPlanIdentifier: 'TEST-123',
          userEmail: 'test@example.com',
          facIdentifier: 1,
          orisCode: 123,
          facName: 'Test Facility',
          configuration: 'Test Config',
          queuedTime: new Date(),
          userIdentifier: 'testUser',
          submissionSetIdentifier: 'test-id',
          statusCode: 'QUEUED',
          note: null,
          noteTime: null
        },
        submissionQueueRecords: [],
        monLocationIds: 'LOC1,LOC2',
        facId: 1,
        unitStackPipe: 'UNIT1',
        monPlanStatus: 'Active',
        toEmail: 'test@example.com',
        ccEmail: null,
        fromEmail: 'system@example.com',
        processCode: 'TEST',
        rptPeriod: null,
        epaAnalystLink: null,
        highestSeverityRecord: {
          submissionQueue: {
            severityCode: 'CRIT2',
            submissionSetIdentifier: 'test-id',
            processCode: 'TEST',
            statusCode: 'QUEUED',
            queuedTime: new Date()
          } as SubmissionQueue,
          severityCode: {
            severityCode: 'CRIT2',
            severityCodeDescription: 'Critical Error Level 2',
            severityLevel: 2,
            esTypeInd: 0,
            evalStatusCode: null
          } as SeverityCode
        }
      };
      const result = await service.getSubmissionReceiptData(submissionEmailParamsDto as any);
      const resubmissionRequired = result.find(pair => pair.key === 'Resubmission Required');
      expect(resubmissionRequired.value).toBe('No');
    });

    it('should not require resubmission when no severity code exists', async () => {
      const submissionEmailParamsDto = {
        orisCode: 123,
        facilityName: 'Test Facility',
        stateCode: 'TX',
        submissionSet: {
          monPlanIdentifier: 'TEST-123',
          userEmail: 'test@example.com',
          facIdentifier: 1,
          orisCode: 123,
          facName: 'Test Facility',
          configuration: 'Test Config',
          queuedTime: new Date(),
          userIdentifier: 'testUser',
          submissionSetIdentifier: 'test-id',
          statusCode: 'QUEUED',
          note: null,
          noteTime: null
        },
        submissionQueueRecords: [],
        monLocationIds: 'LOC1,LOC2',
        facId: 1,
        unitStackPipe: 'UNIT1',
        monPlanStatus: 'Active',
        toEmail: 'test@example.com',
        ccEmail: null,
        fromEmail: 'system@example.com',
        processCode: 'TEST',
        rptPeriod: null,
        epaAnalystLink: null,
        highestSeverityRecord: {
          submissionQueue: {
            severityCode: 'NONE',
            submissionSetIdentifier: 'test-id',
            processCode: 'TEST',
            statusCode: 'QUEUED',
            queuedTime: new Date()
          } as SubmissionQueue,
          severityCode: {
            severityCode: 'NONE',
            severityCodeDescription: 'No Error',
            severityLevel: 0,
            esTypeInd: 0,
            evalStatusCode: null
          } as SeverityCode
        }
      } as SubmissionEmailParamsDto;
      const result = await service.getSubmissionReceiptData(submissionEmailParamsDto as any);
      const resubmissionRequired = result.find(pair => pair.key === 'Resubmission Required');
      expect(resubmissionRequired.value).toBe('No');
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
