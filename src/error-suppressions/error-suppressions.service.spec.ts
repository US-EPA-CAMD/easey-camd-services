jest.mock('@us-epa-camd/easey-common/connection', () => ({
  withSlaveConnection: jest.fn(),
}));

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { ErrorSuppressionsService } from './error-suppressions.service';
import { ErrorSuppressionsRepository } from './error-suppressions.repository';
import { ErrorSuppressionsParamsDTO } from '../dto/error-suppressions.params.dto';
import { genErrorSuppressions } from '../../test/object-generators/error-suppressions';
import { ErrorSuppressionsDTO } from '../dto/error-suppressions.dto';
import { ErrorSuppressionsMap } from '../../src/maps/error-suppressions.map';
import { EsSpec } from '../entities/es-spec.entity';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { ErrorSuppressionsPayloadDTO } from '../dto/error-suppressions-payload.dto';

const mockRepository = () => ({
  getErrorSuppressions: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn().mockReturnValue(new EsSpec()),
});
const mockMap = () => ({
  many: jest.fn(),
  one: jest.fn(),
});

const mockWithSlaveConnection = require('@us-epa-camd/easey-common/connection').withSlaveConnection;

describe('-- Error Suppressions Service --', () => {
  let service: ErrorSuppressionsService;
  let map: any;
  let repository: any;

  beforeEach(async () => {
    mockWithSlaveConnection.mockImplementation(async (dataSource, operation) => {
      const mockManager = {
        query: jest.fn().mockResolvedValue([]),
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
      const originalConstructor = require('./error-suppressions.repository').ErrorSuppressionsRepository;
      const MockedRepository = jest.fn().mockImplementation(() => ({
        getErrorSuppressions: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockReturnValue({}),
      }));

      require('./error-suppressions.repository').ErrorSuppressionsRepository = MockedRepository;

      try {
        return await operation(mockManager);
      } finally {
        // Restore original constructor
        require('./error-suppressions.repository').ErrorSuppressionsRepository = originalConstructor;
      }
    });
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        ConfigService,
        ErrorSuppressionsService,
        {
          provide: ErrorSuppressionsRepository,
          useFactory: mockRepository,
        },
        {
          provide: ErrorSuppressionsMap,
          useFactory: mockMap,
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get(ErrorSuppressionsService);
    repository = module.get(ErrorSuppressionsRepository);
    map = module.get(ErrorSuppressionsMap);
  });

  describe('getErrorSuppressions', () => {
    it('calls ErrorSuppressionsRepository.getErrorSuppressions() and gets all the error suppressions from the repository', async () => {
      const mockedValues = genErrorSuppressions<ErrorSuppressionsDTO>();
      map.many.mockReturnValue(mockedValues);
      let filters = new ErrorSuppressionsParamsDTO();
      let result = await service.getErrorSuppressions(filters);
      expect(result).toEqual(mockedValues);
    });
  });

  describe('createErrorSuppression', () => {
    it('calls ErrorSuppressionsRepository.createErrorSuppression() and creates an error supression record', async () => {
      const mockedDto = genErrorSuppressions<ErrorSuppressionsDTO>()[0];
      map.one.mockReturnValue(mockedDto);
      let payload = new ErrorSuppressionsPayloadDTO();
      repository.findOne.mockResolvedValue(new EsSpec());
      const result = await service.createErrorSuppression(payload, 'user');
      expect(result).toEqual(mockedDto);
    });
  });

  describe('deactivateErrorSuppression', () => {
    it('successfully deactivates an Error Suppression record', async () => {
      const mockedDto = genErrorSuppressions<ErrorSuppressionsDTO>()[0];
      map.one.mockResolvedValue(mockedDto);
      repository.findOne.mockResolvedValue(new EsSpec());
      const result = await service.deactivateErrorSuppression(mockedDto.id);
      expect(result).toEqual(mockedDto);
    });

    it('throws an exception when a record with then given id is not found', async () => {
      const mockedDto = genErrorSuppressions<ErrorSuppressionsDTO>()[0];
      map.one.mockResolvedValue(mockedDto);
      repository.findOne.mockResolvedValue(null);
      expect(service.deactivateErrorSuppression(mockedDto.id)).rejects.toThrow(
        EaseyException,
      );
    });
  });
});
