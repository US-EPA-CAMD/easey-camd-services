import { Test } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { SubmissionQueueDTO } from '../dto/submission-queue.dto';

jest.mock('./submission.service');

describe('-- Evaluation Controller --', () => {
  let controller: SubmissionController;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [SubmissionController],
      providers: [SubmissionService, ConfigService],
    }).compile();

    controller = module.get(SubmissionController);
  });

  it('should be defined', async () => {
    expect(controller).toBeDefined();
  });

  it('evaluate', async () => {
    const dtoParams = new SubmissionQueueDTO();

    expect(async () => {
      await controller.evaluate(dtoParams);
    }).not.toThrowError();
  });
});
