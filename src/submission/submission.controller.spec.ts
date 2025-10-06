import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { ProcessParamsDTO } from '../dto/process-params.dto';
import { SubmissionQueueDTO } from '../dto/submission-queue.dto';
import { CombinedSubmissionsMap } from '../maps/combined-submissions.map';
import { EmissionsLastUpdatedMap } from '../maps/emissions-last-updated.map';
import { SubmissionProcessService } from './submission-process.service';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';

jest.mock('./submission.service');
jest.mock('./submission-process.service');

describe('-- Submission Controller --', () => {
  // Explicitly typed mock instances pulled from the Nest container
  let controller: SubmissionController;
  let submissionService: jest.Mocked<SubmissionService>;
  let processService: jest.Mocked<SubmissionProcessService>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [HttpModule, LoggerModule],
      controllers: [SubmissionController],
      providers: [
        {
          provide: DataSource,
          useValue: {},
        },
        SubmissionService,
        SubmissionProcessService,
        ConfigService,
        CombinedSubmissionsMap,
        EmissionsLastUpdatedMap,
      ],
    }).compile();

    controller = module.get(SubmissionController);

    // Get the auto-mocked class instances that Nest created
    submissionService = module.get(SubmissionService) as any;
    processService = module.get(SubmissionProcessService) as any;

    // Ensure all async service methods return Promises (not undefined)
    submissionService.queueSubmissionRecords.mockResolvedValue(undefined as any);
    submissionService.getLastUpdated.mockResolvedValue({} as any);
    submissionService.getSubmissionQueueOrder?.mockResolvedValue([] as any);

    // IMPORTANT: processSubmissionSet must return a Promise because controller calls `.catch(...)`
    processService.processSubmissionSet.mockResolvedValue(undefined as any);
  });

  it('should be defined', async () => {
    expect(controller).toBeDefined();
  });

  it('should evaluate', async () => {
    const dtoParams = new SubmissionQueueDTO();

    expect(async () => {
      await controller.queue(dtoParams);
    }).not.toThrow();
  });

  it('process', async () => {
    expect(async () => {
      await controller.process(new ProcessParamsDTO());
    }).not.toThrow();
  });

  it('last-updated', async () => {
    expect(async () => {
      await controller.lastUpdated({ date: new Date('2025-02-25') });
    }).not.toThrow();
  });
});
