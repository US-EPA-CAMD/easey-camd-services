import { Test, TestingModule } from '@nestjs/testing';
import { QaTestSummaryService } from './qa-test-summary.service';
import { EntityManager } from 'typeorm';

describe('QaTestSummaryService', () => {
  let service: QaTestSummaryService;
  let entityManager: EntityManager;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QaTestSummaryService, EntityManager],
    }).compile();

    service = module.get<QaTestSummaryService>(QaTestSummaryService);
    entityManager = module.get<EntityManager>(EntityManager)
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully return data', async ()=>{
    jest.spyOn(entityManager, 'find').mockResolvedValue([]);

    const result = await service.getQaTestSummaryData(1, "")
    expect(result).toEqual([])
  })
});
