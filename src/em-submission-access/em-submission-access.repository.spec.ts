import { Test } from '@nestjs/testing';
import { SelectQueryBuilder } from 'typeorm';

import { EmSubmissionAccessParamsDTO } from '../dto/em-submission-access.params.dto';
import { EmSubmissionAccessRepository } from './em-submission-access.repository';

const mockQueryBuilder = () => ({
  andWhere: jest.fn(),
  getMany: jest.fn(),
  select: jest.fn(),
});

let filters = new EmSubmissionAccessParamsDTO();

describe('EmSubmissionAccessRepository', () => {
  let repository: EmSubmissionAccessRepository;
  let queryBuilder: any;
  let req: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EmSubmissionAccessRepository,
        {
          provide: SelectQueryBuilder,
          useFactory: mockQueryBuilder,
        },
      ],
    }).compile();

    repository = module.get(EmSubmissionAccessRepository);
    queryBuilder = module.get(SelectQueryBuilder);

    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.getMany.mockReturnValue('mockResults');

    repository.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
  });

  describe('getEmSumbissionAccess', () => {
    it('calls createQueryBuilder and gets all AnnualUnitData from the repository no filters', async () => {
      const result = await repository.getEmSubmissionAccess(filters);

      expect(queryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual('mockResults');
    });
  });
});
