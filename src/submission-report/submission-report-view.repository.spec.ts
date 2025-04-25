import { Test } from '@nestjs/testing';
import { EntityManager, SelectQueryBuilder } from 'typeorm';

import { SubmissionReportParamsDTO } from '../dto/submission-report-params.dto';
import { SubmissionListViewRepository } from './submission-report-view.repository';

const mockQueryBuilder = () => ({
  andWhere: jest.fn(),
  getMany: jest.fn(),
  select: jest.fn(),
});

let filters = new SubmissionReportParamsDTO();

describe('SubmissionListViewRepository', () => {
  let repository: SubmissionListViewRepository;
  let queryBuilder: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SubmissionListViewRepository,
        EntityManager,
        {
          provide: SelectQueryBuilder,
          useFactory: mockQueryBuilder,
        },
      ],
    }).compile();

    repository = module.get(SubmissionListViewRepository);
    queryBuilder = module.get(SelectQueryBuilder);

    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.getMany.mockReturnValue('mockResults');

    repository.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
  });

  describe('getSubmissionReportList', () => {
    it('gets all submission report list data from the repository', async () => {
      const result = await repository.getSubmissionReportList(filters);

      expect(queryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual('mockResults');
    });
  });
});
