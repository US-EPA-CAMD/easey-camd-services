import { getRepositoryToken } from '@nestjs/typeorm';

jest.mock('@us-epa-camd/easey-common/connection', () => ({
  withSlaveConnection: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager, DataSource } from 'typeorm';

import { QaTestSummaryService } from './qa-test-summary.service';
import { QaUpdateDto } from '../dto/qa-update.dto';
import { QaTestSummaryMaintViewDTO } from '../dto/qa-test-summary-maint-vw.dto';
import { DataSetRepository } from '../dataset/dataset.repository';

const mockQaDto = new QaTestSummaryMaintViewDTO();

const mockDbRow = {
  test_sum_id: '1',
  location_id: '1',
  oris_code: 3,
  unit_stack: 'A',
};

const mockEntityManager = {
  transaction: jest.fn().mockImplementation(async (callback) => {
    return await callback(mockEntityManager);
  }),
  query: jest.fn(),
};

const mockWithSlaveConnection = require('@us-epa-camd/easey-common/connection').withSlaveConnection;

describe('QaTestSummaryService', () => {
  let service: QaTestSummaryService;
  let entityManager: EntityManager;
  const updatePayload = new QaUpdateDto();

  beforeEach(async () => {
    mockWithSlaveConnection.mockImplementation(async (dataSource, operation) => {
      const mockManager = {
        query: jest.fn().mockResolvedValue([mockDbRow]),
        find: jest.fn().mockResolvedValue([]),
        findBy: jest.fn().mockResolvedValue([]),
        getRepository: jest.fn().mockReturnValue({
          find: jest.fn().mockResolvedValue([]),
          findBy: jest.fn().mockResolvedValue([]),
          createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
          }),
        }),
      };
      return await operation(mockManager);
    });
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QaTestSummaryService,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: DataSource,
          useValue: {}
        },
      ],
    }).compile();

    service = module.get<QaTestSummaryService>(QaTestSummaryService);
    entityManager = module.get<EntityManager>(EntityManager);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQaTestSummaryViewData', () => {

    it('should successfully return data', async () => {
      (entityManager.query as jest.Mock).mockResolvedValue([mockDbRow]);
      const mapSpy = jest
        .spyOn(service as any, 'mapToQaTestSummaryMaintViewDTO')
        .mockReturnValue(mockQaDto);

      const result = await service.getQaTestSummaryViewData(3, 'A');
      
      expect(mapSpy).toHaveBeenCalledWith(mockDbRow);
      expect(result).toEqual([mockQaDto]);
    });
  });

  describe('updateSubmissionStatus', () => {
    it('should successfully update and return data', async () => {
      (entityManager.query as jest.Mock).mockResolvedValue([mockDbRow]);
      const mapSpy = jest
        .spyOn(service as any, 'mapToQaTestSummaryMaintViewDTO')
        .mockReturnValue(mockQaDto);

      const result = await service.updateSubmissionStatus(
        '1',
        'testuser',
        updatePayload,
      );

      expect(entityManager.query).toHaveBeenCalledTimes(3);

      expect(mapSpy).toHaveBeenCalledWith([mockDbRow]);
      expect(result).toEqual(mockQaDto);
    });

    it('should throw error if record not found after update', async () => {
      (entityManager.query as jest.Mock).mockResolvedValue([]);

      const result = await service.updateSubmissionStatus(
        '1',
        'testuser',
        updatePayload,
      );

      expect(result).toBeInstanceOf(QaTestSummaryMaintViewDTO);
      expect(result.id).toBeUndefined();
      expect(result.orisCode).toBeNaN();
    });
  });
  
  describe('deleteQATestSummaryData', () => {
    it('should successfully delete data', async () => {
        (entityManager.query as jest.Mock).mockResolvedValue(undefined);

        const result = await service.deleteQATestSummaryData('1');
        expect(result).toEqual({
            message: `Record with id 1 has been successfully deleted.`,
        });
        expect(entityManager.query).toHaveBeenCalledTimes(4);
    });
  });
});