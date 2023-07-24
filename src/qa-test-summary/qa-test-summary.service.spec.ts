import { Test, TestingModule } from '@nestjs/testing';
import { QaTestSummaryService } from './qa-test-summary.service';
import { EntityManager } from 'typeorm';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { QaUpdateDto } from '../dto/qa-update.dto';

describe('QaTestSummaryService', () => {
  let service: QaTestSummaryService;
  let entityManager: EntityManager;
  let updatePayload;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QaTestSummaryService, EntityManager],
    }).compile();

    service = module.get<QaTestSummaryService>(QaTestSummaryService);
    entityManager = module.get<EntityManager>(EntityManager);
    updatePayload = new QaUpdateDto();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully return data', async () => {
    jest.spyOn(entityManager, 'find').mockResolvedValue([]);

    const result = await service.getQaTestSummaryViewData(1, '');
    expect(result).toEqual([]);
  });
  it('should successfully update and return data', async () => {
    jest.spyOn(entityManager, 'transaction').mockResolvedValue([[], 1]);
    // jest.spyOn(entityManager, 'query').mockResolvedValue([[], 1]);
    jest.spyOn(entityManager, 'findOne').mockResolvedValue({});

    const result = await service.updateSubmissionStatus(
      'id',
      'userId',
      updatePayload,
    );
    expect(result).toEqual({});
  });

  it('should throw error while updating data', async () => {
    jest.spyOn(entityManager, 'transaction').mockResolvedValue([[], 1]);

    jest
      .spyOn(entityManager, 'findOne')
      .mockRejectedValue(new EaseyException(new Error('Error'), 500));

    let errored = false;
    try {
      await service.updateSubmissionStatus('id', 'userId', updatePayload);
    } catch {
      errored = true;
    }
    expect(errored).toEqual(true);
  });

  it('should successfully delete data', async () => {
    jest.spyOn(entityManager, 'transaction').mockResolvedValue([[], 1]);

    const result = await service.deleteQATestSummaryData('1');
    expect(result).toEqual({
      message: `Record with id 1 has been successfully deleted.`,
    });
  });

  it('should throw error while deleting data', async () => {
    jest
      .spyOn(entityManager, 'transaction')
      .mockRejectedValue(new EaseyException(new Error('Error'), 500));

    let errored = false;
    try {
      await service.deleteQATestSummaryData('1');
    } catch {
      errored = true;
    }
    expect(errored).toEqual(true);
  });
});
