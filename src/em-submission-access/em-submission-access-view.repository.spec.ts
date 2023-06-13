import { Test } from '@nestjs/testing';
import { SelectQueryBuilder } from 'typeorm';

import { EmSubmissionAccessParamsDTO } from '../dto/em-submission-access.params.dto';
import { EmSubmissionAccessViewRepository } from './em-submission-access-view.repository';

const mockQueryBuilder = () => ({
  andWhere: jest.fn(),
  getMany: jest.fn(),
  select: jest.fn(),
});

let filters = new EmSubmissionAccessParamsDTO();

describe('EmSubmissionAccessViewRepository', () => {
  let repository: EmSubmissionAccessViewRepository;
  let queryBuilder: any;
  let req: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EmSubmissionAccessViewRepository,
        {
          provide: SelectQueryBuilder,
          useFactory: mockQueryBuilder,
        },
      ],
    }).compile();

    repository = module.get(EmSubmissionAccessViewRepository);
    queryBuilder = module.get(SelectQueryBuilder);

    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.getMany.mockReturnValue('mockResults');

    repository.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
  });

  describe('getEmSumbissionAccess', () => {
    it('gets all EmSubmissionAccess data from the repository', async () => {
      const result = await repository.getEmSubmissionAccess(filters);

      expect(queryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual('mockResults');
    });
  });
});
