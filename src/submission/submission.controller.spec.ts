import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { SubmissionsDTO } from '../dto/submission.dto';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';

jest.mock('@us-epa-camd/easey-common/guards');

describe('-- Submission Controller --', () => {
  let controller: SubmissionController;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      controllers: [SubmissionController],
      providers: [
        {
          provide: SubmissionService,
          useFactory: () => ({
            handleSubmission: jest.fn().mockResolvedValue(true),
          }),
        },
      ],
    }).compile();

    controller = module.get(SubmissionController);
  });

  it('should be defined', async () => {
    expect(controller).toBeDefined();
  });

  it('controller should call the service', async () => {
    const result = await controller.submit(null, new SubmissionsDTO());
    expect(result).toBe(true);
  });
});
