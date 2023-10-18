import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { SubmissionProcessService } from './submission-process.service';
import { DataSetService } from '../dataset/dataset.service';
import { CopyOfRecordService } from '../copy-of-record/copy-of-record.service';
import { SubmissionSet } from '../entities/submission-set.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import * as fsFunctions from 'fs';
import { ReportDTO } from '../dto/report.dto';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { QaSuppData } from '../entities/qa-supp.entity';
import { EmissionEvaluation } from '../entities/emission-evaluation.entity';
import { Observable, of } from 'rxjs';
import { MailEvalService } from '../mail/mail-eval.service';

jest.mock('@aws-sdk/client-s3');

describe('-- Submission Process Service --', () => {
  let service: SubmissionProcessService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      controllers: [],
      providers: [
        ConfigService,
        SubmissionProcessService,
        {
          provide: MailEvalService,
          useFactory: () => ({
            sendMassEvalEmail: jest.fn(),
          }),
        },
        {
          provide: HttpService,
          useFactory: () => ({
            post(url: string, data: any): Observable<any> {
              // Simulate an HTTP POST request and return an observable
              return of({ message: 'Mock HTTP response', data });
            },
            get() {
              return of([]);
            },
          }),
        },
        {
          provide: DataSetService,
          useFactory: () => ({
            getDataSet: jest.fn().mockResolvedValue(new ReportDTO()),
          }),
        },
        {
          provide: CopyOfRecordService,
          useFactory: () => ({
            generateCopyOfRecord: jest.fn().mockReturnValue('mockReport'),
            generateCopyOfRecordCert: jest.fn().mockResolvedValue(''),
          }),
        },
      ],
    }).compile();

    service = module.get(SubmissionProcessService);
  });

  beforeEach(() => {
    const set = new SubmissionSet();
    set.activityId = 'mock';

    jest.spyOn(service, 'returnManager').mockReturnValue({
      findOne: jest.fn().mockImplementation((val) => {
        switch (val.name) {
          case 'SubmissionSet':
            return set;
          case 'SubmissionQueue':
            return new SubmissionQueue();
          case 'MonitorPlan':
            return new MonitorPlan();
          case 'QaSuppData':
            return new QaSuppData();
          case 'EmissionEvaluation':
            return new EmissionEvaluation();
        }
        return false;
      }),

      transaction: jest.fn(),

      find: jest.fn().mockResolvedValue([new SubmissionQueue()]),

      save: jest.fn(),
    });
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should ensure getCopyOfRecord fires correctly', async () => {
    const mockTransactions = [];

    const record = new SubmissionQueue();
    record.processCode = 'MP';

    const set = new SubmissionSet();
    set.facIdentifier = 1;
    set.monPlanIdentifier = 'mockMP';

    await service.buildTransactions(set, record, [], mockTransactions, '');

    expect(mockTransactions.length).toBe(1);
  });

  it('should set record status code correctly for files sent in', async () => {
    const mockMP = new MonitorPlan();
    const mockQaT = new QaSuppData();
    const mockEm = new EmissionEvaluation();

    jest.spyOn(service, 'returnManager').mockReturnValue({
      findOne: jest.fn().mockImplementation((val) => {
        switch (val.name) {
          case 'MonitorPlan':
            return mockMP;
          case 'QaSuppData':
            return mockQaT;
          case 'EmissionEvaluation':
            return mockEm;
        }
        return false;
      }),

      save: jest.fn(),
    });

    const set = new SubmissionSet();
    set.facIdentifier = 1;
    set.monPlanIdentifier = 'mockMP';

    const record1 = new SubmissionQueue();
    record1.processCode = 'MP';
    record1.testSumIdentifier = null;
    record1.rptPeriodIdentifier = null;

    const record2 = new SubmissionQueue();
    record2.processCode = 'QA';
    record2.testSumIdentifier = 'mock';

    const record3 = new SubmissionQueue();
    record3.processCode = 'EM';
    record3.rptPeriodIdentifier = 1;

    await service.setRecordStatusCode(
      set,
      [record1, record2, record3],
      'COMPLETE',
      '',
      'UPDATED',
    );

    expect(mockMP.submissionAvailabilityCode).toEqual('UPDATED');
    //expect(mockQaT.submissionAvailabilityCode).toEqual('UPDATED');
    //expect(mockEm.submissionAvailabilityCode).toEqual('UPDATED');
  });

  it('should handle cleanup of success correctly', async () => {
    jest.spyOn(fsFunctions, 'rmSync').mockImplementation();

    jest.spyOn(service, 'setRecordStatusCode').mockImplementation(jest.fn());

    expect(async () => {
      await service.successCleanup(
        '',
        new SubmissionSet(),
        [new SubmissionQueue()],
        [],
      );
    }).not.toThrowError();
  });

  it('should process submission set fires correctly', async () => {
    jest.spyOn(service, 'buildTransactions').mockResolvedValue();
    jest.spyOn(service, 'buildDocuments').mockResolvedValue();
    jest.spyOn(service, 'successCleanup').mockResolvedValue();
    jest.spyOn(fsFunctions, 'writeFile').mockImplementation(jest.fn());
    jest.spyOn(fsFunctions, 'mkdirSync').mockImplementation(jest.fn());
    jest.spyOn(fsFunctions, 'writeFileSync').mockImplementation(jest.fn());
    jest.spyOn(fsFunctions, 'readdirSync').mockReturnValue([]);
    jest.spyOn(fsFunctions, 'createReadStream').mockImplementation();
    jest.spyOn(fsFunctions, 'rmSync').mockImplementation();

    jest.spyOn(service, 'setRecordStatusCode').mockImplementation(jest.fn());

    expect(async () => {
      await service.processSubmissionSet('');
    }).not.toThrowError();
  });
});
