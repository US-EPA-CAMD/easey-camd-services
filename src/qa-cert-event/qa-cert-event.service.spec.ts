import { Test, TestingModule } from '@nestjs/testing';
import { QaCertEventService } from './qa-cert-event.service';
import { EntityManager } from 'typeorm';

describe('QaCertEventService', () => {
  let service: QaCertEventService;
  let entityManager: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QaCertEventService, EntityManager],
    }).compile();

    service = module.get<QaCertEventService>(QaCertEventService);

    entityManager = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully return data', async () => {
    jest.spyOn(entityManager, 'find').mockResolvedValue([]);

    const result = await service.getQaCertEventViewData(1, '');
    expect(result).toEqual([]);
  });

  it('should successfully update and return data', async () => {
    jest.spyOn(entityManager, 'query').mockResolvedValue([[], 1]);
    jest.spyOn(entityManager, 'findOne').mockResolvedValue({});

    const result = await service.updateSubmissionStatus('id', 'userId');
    expect(result).toEqual({});
  });
});
