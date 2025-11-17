jest.mock('@us-epa-camd/easey-common/connection', () => ({
  withSlaveConnection: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { QaCertEventService } from './qa-cert-event.service';
import { EntityManager, DataSource } from 'typeorm';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { QaUpdateDto } from '../dto/qa-update.dto';
import { QaCertEventMaintMap } from '../maps/qa-cert-event-maint.map';

const mockWithSlaveConnection = require('@us-epa-camd/easey-common/connection').withSlaveConnection;

describe('QaCertEventService', () => {
  let service: QaCertEventService;
  let entityManager: EntityManager;
  let updatePayload;

  beforeEach(async () => {
    mockWithSlaveConnection.mockImplementation(async (dataSource, operation) => {
      const mockManager = {
        query: jest.fn().mockResolvedValue([]),
        find: jest.fn().mockResolvedValue([]),
        findBy: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
        findOneBy: jest.fn().mockResolvedValue(null),
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
        QaCertEventService, 
        {
          provide: EntityManager,
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            query: jest.fn(),
            transaction: jest.fn(),
          },
        },
        QaCertEventMaintMap,
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<QaCertEventService>(QaCertEventService);

    entityManager = module.get<EntityManager>(EntityManager);
    updatePayload = new QaUpdateDto();
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
    jest.spyOn(entityManager, 'findOneBy').mockResolvedValue({});

    const result = await service.updateSubmissionStatus(
      'id',
      'userId',
      updatePayload,
    );
    expect(result).toEqual({});
  });

  it('should throw error while updating data', async () => {
    jest.spyOn(entityManager, 'query').mockResolvedValue([[], 1]);

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

  describe('deleteQACertEventData', () => {
    it('should successfully delete data within a transaction', async () => {
      const transactionalQuerySpy = jest.fn().mockResolvedValue(undefined);

      (entityManager.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          await callback({ query: transactionalQuerySpy });
        },
      );

      const idToDelete = '1';
      await service.deleteQACertEventData(idToDelete);

      expect(entityManager.transaction).toHaveBeenCalled();

      expect(transactionalQuerySpy).toHaveBeenCalledTimes(3);
      expect(transactionalQuerySpy).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM camdecmps.qa_cert_event'),
        [idToDelete],
      );
      expect(transactionalQuerySpy).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM camdecmpswks.qa_cert_event'),
        [idToDelete],
      );
      expect(transactionalQuerySpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'DELETE FROM camdecmpswks.qa_cert_event_supp_data',
        ),
        [idToDelete],
      );
    });

    it('should throw an error if the transaction fails', async () => {
      const testError = new Error('Database transaction failed');

      (entityManager.transaction as jest.Mock).mockImplementation(async () => {
        throw testError;
      });

      await expect(service.deleteQACertEventData('1')).rejects.toThrow(
        EaseyException,
      );
      await expect(service.deleteQACertEventData('1')).rejects.toThrow(
        'Database transaction failed',
      );
    });
  });
});
