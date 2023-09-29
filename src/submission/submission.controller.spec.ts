import { Test } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { SubmissionQueueDTO } from '../dto/submission-queue.dto';
import { SubmissionProcessService } from './submission-process.service';
import { ProcessParamsDTO } from '../dto/process-params.dto';
import { CombinedSubmissionsMap } from '../maps/combined-submissions.map';
import { EmissionsLastUpdatedMap } from '../maps/emissions-last-updated.map';

jest.mock('./submission.service');
jest.mock('./submission-process.service');

describe('-- Submission Controller --', () => {
  let controller: SubmissionController;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [SubmissionController],
      providers: [
        SubmissionService,
        SubmissionProcessService,
        ConfigService,
        CombinedSubmissionsMap,
        EmissionsLastUpdatedMap,
      ],
    }).compile();

    controller = module.get(SubmissionController);
  });

  it('should be defined', async () => {
    expect(controller).toBeDefined();
  });

  it('evaluate', async () => {
    const dtoParams = new SubmissionQueueDTO();

    expect(async () => {
      await controller.queue(dtoParams);
    }).not.toThrowError();
  });

  it('process', async () => {
    expect(async () => {
      await controller.process(new ProcessParamsDTO());
    }).not.toThrowError();
  });

  it('last-updated', async () => {
    expect(async () => {
      await controller.lastUpdated('');
    }).not.toThrowError();
  });
});
