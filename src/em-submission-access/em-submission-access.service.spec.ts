import { Test, TestingModule } from '@nestjs/testing';
import { EmSubmissionAccessService } from './em-submission-access.service';
import { EmSubmissionAccessRepository } from './em-submission-access.repository';
import { EmSubmissionAccessDTO } from '../dto/em-submission-access.dto';
import { EmSubmissionAccessParamsDTO } from '../dto/em-submission-access.params.dto';
import { EmSubmissionAccessMap } from '../maps/em-submission-access.map';

const mockRepository = () => ({
  getEmSubmissionAccess: jest.fn(),
});

describe('EmSubmissionAccessService', () => {
  let service: EmSubmissionAccessService;
  let repository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmSubmissionAccessService,
        EmSubmissionAccessMap,
        {
          provide: EmSubmissionAccessRepository,
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get(EmSubmissionAccessService);
    repository = module.get(EmSubmissionAccessRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully return data', async () => {
    const expected = new EmSubmissionAccessDTO();
    repository.getEmSubmissionAccess.mockResolvedValue([expected]);
    let filters = new EmSubmissionAccessParamsDTO();
    let result = await service.getEmSubmissionAccess(filters);
    expect(result).toEqual([expected]);
  });
});
