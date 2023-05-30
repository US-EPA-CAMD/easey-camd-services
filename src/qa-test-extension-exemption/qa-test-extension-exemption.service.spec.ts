import { Test, TestingModule } from '@nestjs/testing';
import { QaTestExtensionExemptionService } from './qa-test-extension-exemption.service';
import { EntityManager } from 'typeorm';

describe('QaTestExtensionExemptionService', () => {
  let service: QaTestExtensionExemptionService;
  let entityManager: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QaTestExtensionExemptionService, EntityManager],
    }).compile();

    service = module.get<QaTestExtensionExemptionService>(
      QaTestExtensionExemptionService,
    );
    entityManager = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully return data', async () => {
    jest.spyOn(entityManager, 'find').mockResolvedValue([]);

    const result = await service.getQaTeeViewData(1, '');
    expect(result).toEqual([]);
  });

  it('should successfully update and return data', async () => {
    jest.spyOn(entityManager, 'query').mockResolvedValue([[], 1]);
    jest.spyOn(entityManager, 'findOne').mockResolvedValue({});

    const result = await service.updateSubmissionStatus('id', 'userId');
    expect(result).toEqual({});
  });
});
