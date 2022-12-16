import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { SubmissionItem, SubmissionsDTO } from '../dto/submission.dto';
import SubmissionBuilder from './submission-builder.service';
import { SubmissionService } from './submission.service';

const mockSubmissionBuilder = () => ({
  handleMpSubmission: jest.fn(),
  handleQASubmission: jest.fn(),
  handleEmSubmission: jest.fn(),
});

describe('-- Submission Service --', () => {
  let service: SubmissionService;
  let builderService: SubmissionBuilder;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        SubmissionService,
        ConfigService,
        { provide: SubmissionBuilder, useFactory: mockSubmissionBuilder },
      ],
    }).compile();

    service = module.get(SubmissionService);
    builderService = module.get(SubmissionBuilder);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should execute properly and make the correct function calls', async () => {
    const mockMpCall = jest.fn().mockReturnValue([]);
    const mockQACall = jest.fn().mockReturnValue([]);
    const mockEMCall = jest.fn().mockReturnValue([]);

    const mockInsertion = jest.fn();

    jest.spyOn(service, 'returnManager').mockReturnValue({
      findOne: jest.fn().mockResolvedValue({ id: 'mockId' }),
      insert: mockInsertion,
    });

    builderService.handleMpSubmission = mockMpCall;
    builderService.handleQASubmission = mockQACall;
    builderService.handleEmSubmission = mockEMCall;

    const submissionDto = new SubmissionsDTO();
    submissionDto.activityId = 'mock';
    submissionDto.items = [new SubmissionItem()];

    await service.handleSubmission(
      {
        userId: 'mockUser',
        sessionId: null,
        expiration: null,
        clientIp: null,
        isAdmin: true,
        permissionSet: null,
      },
      submissionDto,
    );

    expect(mockMpCall).toHaveBeenCalled();
    expect(mockQACall).toHaveBeenCalled();
    expect(mockEMCall).toHaveBeenCalled();
    expect(mockInsertion).toHaveBeenCalled();
  });
});
