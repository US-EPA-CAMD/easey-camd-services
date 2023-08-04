import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { SubmissionProcessService } from './submission-process.service';
import { DataSetService } from '../dataset/dataset.service';
import { CopyOfRecordService } from '../copy-of-record/copy-of-record.service';
import { SubmissionSet } from '../entities/submission-set.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import * as fsFunctions from 'fs';
import { ReportDTO } from '../dto/report.dto';

describe('-- Submission Process Service --', () => {
  let service: SubmissionProcessService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      controllers: [],
      providers: [
        SubmissionProcessService,
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
          }),
        },
      ],
    }).compile();

    service = module.get(SubmissionProcessService);
  });

  beforeEach(() => {
    jest.spyOn(service, 'returnManager').mockReturnValue({
      findOne: jest.fn().mockImplementation((val) => {
        switch (val.name) {
          case 'SubmissionSet':
            return new SubmissionSet();
          case 'SubmissionQueue':
            return new SubmissionQueue();
        }
        return false;
      }),

      find: jest.fn().mockResolvedValue([new SubmissionQueue()]),

      save: jest.fn(),
    });
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should ensure getCopyOfRecord fires correctly', async () => {
    const mockDocuments = [];

    const record = new SubmissionQueue();
    record.processCode = 'MP';

    await service.getCopyOfRecord(
      new SubmissionSet(),
      record,
      mockDocuments,
      [],
    );

    expect(mockDocuments.length).toBe(1);
    expect(mockDocuments[0]).toEqual('mockReport');
  });

  it('should process submission set fires correctly', async () => {
    jest.spyOn(service, 'getCopyOfRecord').mockResolvedValue();
    jest.spyOn(fsFunctions, 'writeFile').mockImplementation(() => {});

    await service.processSubmissionSet('');

    expect(service).toBeDefined();
  });
});
