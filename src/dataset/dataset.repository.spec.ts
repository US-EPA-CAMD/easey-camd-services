import { Test } from '@nestjs/testing';
import { SelectQueryBuilder } from 'typeorm';

import { DataSetRepository } from './dataset.repository';

const mockQueryBuilder = () => ({
  innerJoinAndSelect: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getOne: jest.fn(),
});

describe('DataSetRepository', () => {
  let queryBuilder: any;
  let repository: DataSetRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DataSetRepository,
        {
          provide: SelectQueryBuilder,
          useFactory: mockQueryBuilder,
        },
      ],
    }).compile();

    repository = module.get(DataSetRepository);
    queryBuilder = module.get(SelectQueryBuilder);

    repository.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);

    queryBuilder.innerJoinAndSelect.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.getOne.mockReturnValue({});
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
    expect(queryBuilder).toBeDefined();
  });

  describe('getDataSet', () => {
    it('should return a dataset', async () => {
      const result = await repository.getDataSet('');
      expect(queryBuilder.innerJoinAndSelect).toHaveBeenCalled();
      expect(queryBuilder.where).toHaveBeenCalled();
      expect(queryBuilder.orderBy).toHaveBeenCalled();
      expect(queryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual({});
    });
  });
});
