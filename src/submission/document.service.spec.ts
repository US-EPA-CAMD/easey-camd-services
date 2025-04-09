import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from './document.service';
import { DataSetService } from '../dataset/dataset.service';
import { CopyOfRecordService } from '../copy-of-record/copy-of-record.service';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { EntityManager } from 'typeorm';
import { SubmissionSet } from '../entities/submission-set.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import { ReportDTO } from '../dto/report.dto';
import { ReportColumnDTO } from '../dto/report-column.dto';
import { ReportDetailDTO } from '../dto/report-detail.dto';
import * as fs from 'fs';

jest.mock('fs');
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
  mkdirSync: jest.fn(),
}));

describe('DocumentService', () => {
  let service: DocumentService;
  let dataSetService: DataSetService;
  let copyOfRecordService: CopyOfRecordService;
  let httpService: HttpService;
  let entityManager: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        DocumentService,
        {
          provide: DataSetService,
          useValue: {
            getDataSet: jest.fn(),
          },
        },
        {
          provide: CopyOfRecordService,
          useValue: {
            generateCopyOfRecord: jest.fn(),
            generateCopyOfRecordCert: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-value'),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
    dataSetService = module.get<DataSetService>(DataSetService);
    copyOfRecordService = module.get<CopyOfRecordService>(CopyOfRecordService);
    httpService = module.get<HttpService>(HttpService);
    entityManager = module.get<EntityManager>(EntityManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addEvalReports', () => {
    it('should only generate evaluation reports for CRIT1 and FATAL severity codes', async () => {
      const set = new SubmissionSet();
      set.orisCode = 123;
      set.monPlanIdentifier = 'test-mon-plan-id';

      // Create records with different severity codes
      const crit1Record = new SubmissionQueue();
      crit1Record.severityCode = 'CRIT1';
      crit1Record.processCode = 'MP';

      const fatalRecord = new SubmissionQueue();
      fatalRecord.severityCode = 'FATAL';
      fatalRecord.processCode = 'MP';

      const crit2Record = new SubmissionQueue();
      crit2Record.severityCode = 'CRIT2';
      crit2Record.processCode = 'MP';

      const crit3Record = new SubmissionQueue();
      crit3Record.severityCode = 'CRIT3';
      crit3Record.processCode = 'MP';

      const records = [crit1Record, fatalRecord, crit2Record, crit3Record];
      const documents = [];

      // Create a proper mock ReportDTO object
      const mockReportDTO = new ReportDTO();
      mockReportDTO.details = [];
      mockReportDTO.columns = [];

      // Mock dataSetService.getDataSet
      jest.spyOn(dataSetService, 'getDataSet').mockResolvedValue(mockReportDTO);

      // Mock copyOfRecordService.generateCopyOfRecord
      jest.spyOn(copyOfRecordService, 'generateCopyOfRecord').mockReturnValue('mock-report');

      await service.addEvalReports(set, records, documents);

      // Verify that getDataSet was called only for CRIT1 and FATAL records
      expect(dataSetService.getDataSet).toHaveBeenCalledTimes(2);

      // Verify that documents array has 2 items (one for each critical record)
      expect(documents.length).toBe(2);

      // Reset mocks
      jest.clearAllMocks();
    });

    it('should not generate evaluation reports for non-critical severity codes', async () => {
      const set = new SubmissionSet();
      set.orisCode = 123;
      set.monPlanIdentifier = 'test-mon-plan-id';

      // Create records with non-critical severity codes
      const crit2Record = new SubmissionQueue();
      crit2Record.severityCode = 'CRIT2';
      crit2Record.processCode = 'MP';

      const crit3Record = new SubmissionQueue();
      crit3Record.severityCode = 'CRIT3';
      crit3Record.processCode = 'MP';

      const noncritRecord = new SubmissionQueue();
      noncritRecord.severityCode = 'NONCRIT';
      noncritRecord.processCode = 'MP';

      const records = [crit2Record, crit3Record, noncritRecord];
      const documents = [];

      // Create a proper mock ReportDTO object
      const mockReportDTO = new ReportDTO();
      mockReportDTO.details = [];
      mockReportDTO.columns = [];

      // Mock dataSetService.getDataSet
      jest.spyOn(dataSetService, 'getDataSet').mockResolvedValue(mockReportDTO);

      // Mock copyOfRecordService.generateCopyOfRecord
      jest.spyOn(copyOfRecordService, 'generateCopyOfRecord').mockReturnValue('mock-report');

      await service.addEvalReports(set, records, documents);

      // Verify that getDataSet was not called for any records
      expect(dataSetService.getDataSet).not.toHaveBeenCalled();

      // Verify that documents array is empty
      expect(documents.length).toBe(0);

      // Reset mocks
      jest.clearAllMocks();
    });
  });

  describe('buildDocuments', () => {
    it('should build documents successfully and sign them', async () => {
      const set = new SubmissionSet();
      const records = [new SubmissionQueue()];
      const folderPath = 'mock/folder/path';

      jest.spyOn(service, 'addEvalReports').mockResolvedValue();
      jest.spyOn(service, 'buildCopyOfRecords').mockResolvedValue();
      jest.spyOn(service, 'addCertificationStatements').mockResolvedValue();

      jest.spyOn(fs, 'writeFileSync').mockImplementation(jest.fn());

      const result = await service.buildDocumentsAndWriteToFile(set, records, folderPath);

      expect(service.addEvalReports).toHaveBeenCalledWith(set, records, expect.any(Array));
      expect(service.buildCopyOfRecords).toHaveBeenCalledWith(set, records, expect.any(Array));
      expect(service.addCertificationStatements).toHaveBeenCalledWith(set, expect.any(Array));
      expect(result).toBeDefined();
    });
  });
});
