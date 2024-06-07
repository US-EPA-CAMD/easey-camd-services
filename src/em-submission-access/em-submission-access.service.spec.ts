import { Test, TestingModule } from '@nestjs/testing';
import { EmSubmissionAccessService } from './em-submission-access.service';
import { EmSubmissionAccessViewRepository } from './em-submission-access-view.repository';
import {
  EmSubmissionAccessCreateDTO,
  EmSubmissionAccessDTO,
  EmSubmissionAccessUpdateDTO,
} from '../dto/em-submission-access.dto';
import { EmSubmissionAccessParamsDTO } from '../dto/em-submission-access.params.dto';
import { EmSubmissionAccessMap } from '../maps/em-submission-access.map';
import { EmSubmissionAccessRepository } from './em-submission-access.repository';
import { genEmSubmissionAccess } from '../../test/object-generators/em-submission-access';
import { EmSubmissionAccess } from '../entities/em-submission-access.entity';

const mockViewRepository = () => ({
  getEmSubmissionAccess: jest.fn(),
  findOneBy: jest.fn(),
});

const mockRepository = () => ({
  save: jest.fn(),
  create: jest.fn().mockReturnValue(new EmSubmissionAccess()),
  findOneBy: jest.fn(),
});

const mockMap = () => ({
  many: jest.fn(),
  one: jest.fn(),
});

describe('EmSubmissionAccessService', () => {
  let service: EmSubmissionAccessService;
  let viewRepository: any;
  let repository: any;
  let map: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmSubmissionAccessService,
        EmSubmissionAccessMap,
        {
          provide: EmSubmissionAccessViewRepository,
          useFactory: mockViewRepository,
        },
        {
          provide: EmSubmissionAccessMap,
          useFactory: mockMap,
        },
        {
          provide: EmSubmissionAccessRepository,
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get(EmSubmissionAccessService);
    viewRepository = module.get(EmSubmissionAccessViewRepository);
    repository = module.get(EmSubmissionAccessRepository);
    map = module.get(EmSubmissionAccessMap);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully return data', async () => {
    const mockedValues = genEmSubmissionAccess<EmSubmissionAccessDTO>();
    map.many.mockReturnValue(mockedValues);
    let filters = new EmSubmissionAccessParamsDTO();
    let result = await service.getEmSubmissionAccess(filters);
    expect(result).toEqual(mockedValues);
  });

  it('calls EmSubmissionAccessRepository.createEmSubmissionAccess() and creates an emission submission access record', async () => {
    const mockedDto = genEmSubmissionAccess<EmSubmissionAccessDTO>()[0];
    map.one.mockReturnValue(mockedDto);
    let payload = new EmSubmissionAccessCreateDTO();
    viewRepository.findOneBy.mockResolvedValue(new EmSubmissionAccess());
    const result = await service.createEmSubmissionAccess(payload, 'user');
    expect(result).toEqual(mockedDto);
  });

  it('calls EmSubmissionAccessRepository.updateEmSubmissionAccess() and updates an emission submission access record', async () => {
    const mockedDto = genEmSubmissionAccess<EmSubmissionAccessDTO>()[0];
    map.one.mockReturnValue(mockedDto);
    let payload = new EmSubmissionAccessUpdateDTO();
    repository.findOneBy.mockResolvedValue(new EmSubmissionAccess());
    const result = await service.updateEmSubmissionAccess(
      mockedDto.id,
      payload,
    );
    expect(result).toEqual(mockedDto);
  });
});
