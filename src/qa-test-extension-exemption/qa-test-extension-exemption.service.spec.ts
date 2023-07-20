import { Test, TestingModule } from '@nestjs/testing';
import { QaTestExtensionExemptionService } from './qa-test-extension-exemption.service';
import { EntityManager } from 'typeorm';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';

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

  it('should throw error while updating data', async () => {
    jest.spyOn(entityManager, 'query').mockResolvedValue([[], 1]);

    jest
      .spyOn(entityManager, 'findOne')
      .mockRejectedValue(new EaseyException(new Error('Error'), 500));

    let errored = false;
    try {
      await service.updateSubmissionStatus('id', 'userId');
    } catch {
      errored = true;
    }
    expect(errored).toEqual(true);
  });

  it('should successfully delete data', async () => {
    jest.spyOn(entityManager, 'query').mockResolvedValue([[], 1]);

    const result = await service.deleteQACertTeeData('1');
    expect(result).toEqual({
      message: `Record with id 1 has been successfully deleted.`,
    });
  });

  it('should throw error while deleting data', async () => {
    jest
      .spyOn(entityManager, 'query')
      .mockRejectedValue(new EaseyException(new Error('Error'), 500));

    let errored = false;
    try {
      await service.deleteQACertTeeData('1');
    } catch {
      errored = true;
    }
    expect(errored).toEqual(true);
  });
});
