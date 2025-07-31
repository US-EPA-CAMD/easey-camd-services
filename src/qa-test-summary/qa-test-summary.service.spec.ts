import { Test, TestingModule } from '@nestjs/testing';
import { QaTestSummaryService } from './qa-test-summary.service';
import { EntityManager } from 'typeorm';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { QaUpdateDto } from '../dto/qa-update.dto';
import { QaTestSummaryMaintMap } from '../maps/qa-test-summary-maint.map';

describe('QaTestSummaryService', () => {
  let service: QaTestSummaryService;
  let entityManager: EntityManager;
  let updatePayload;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QaTestSummaryService,
        QaTestSummaryMaintMap,
        {
          provide: EntityManager,
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            transaction: jest.fn(),
          },
        },
      ],
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
    jest.spyOn(entityManager, 'findOneBy').mockResolvedValue({});

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
      .spyOn(entityManager, 'findOneBy')
      .mockRejectedValue(new EaseyException(new Error('Error'), 500));

    let errored = false;
    try {
      await service.updateSubmissionStatus('id', 'userId', updatePayload);
    } catch {
      errored = true;
    }
    expect(errored).toEqual(true);
  });

  it('should successfully delete data from official and workspace tables', async () => {
    const idToDelete = '1';
    const transactionalEntityManager = { query: jest.fn().mockResolvedValue(null) };

    (entityManager.transaction as jest.Mock).mockImplementation(async (callback) => {
        await callback(transactionalEntityManager);
    });

    const result = await service.deleteQATestSummaryData(idToDelete);

    expect(result).toEqual({
      message: `Record with id ${idToDelete} has been successfully deleted.`,
    });

    const queryCalls = transactionalEntityManager.query.mock.calls;
    expect(queryCalls.length).toBe(4);

    // Verify each specific DELETE query was called
    expect(queryCalls[0][0]).toContain('DELETE FROM camdecmps.test_summary');
    expect(queryCalls[1][0]).toContain('DELETE FROM camdecmps.qa_supp_data');
    expect(queryCalls[2][0]).toContain('DELETE FROM camdecmpswks.test_summary');
    expect(queryCalls[3][0]).toContain('DELETE FROM camdecmpswks.qa_supp_data');
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
