import { Test, TestingModule } from '@nestjs/testing';
import { QaCertEventService } from './qa-cert-event.service';
import { EntityManager } from 'typeorm';
import { LoggingException } from '@us-epa-camd/easey-common/exceptions';

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

  it('should throw error while updating data', async () => {
    jest.spyOn(entityManager, 'query').mockResolvedValue([[], 1]);

    jest
      .spyOn(entityManager, 'findOne')
      .mockRejectedValue(new LoggingException('Error', 500));

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

    const result = await service.deleteQACertEventData('1');
    expect(result).toEqual({
      message: `Record with id 1 has been successfully deleted.`,
    });
  });

  it('should throw error while deleting data', async () => {
    jest
      .spyOn(entityManager, 'query')
      .mockRejectedValue(new LoggingException('Error', 500));

    let errored = false;
    try {
      await service.deleteQACertEventData('1');
    } catch {
      errored = true;
    }
    expect(errored).toEqual(true);
  });
});
