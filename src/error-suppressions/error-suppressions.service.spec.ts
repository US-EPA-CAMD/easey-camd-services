import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { ErrorSuppressionsService } from './error-suppressions.service';
import { ErrorSuppressionsRepository } from './error-suppressions.repository';
import { ErrorSuppressionsParamsDTO } from '../dto/error-suppressions.params.dto';
import { genErrorSuppressions } from '../../test/object-generators/error-suppressions';
import { ErrorSuppressionsDTO } from '../dto/error-suppressions.dto';
import { ErrorSuppressionsMap } from '../../src/maps/error-suppressions.map';
import { EsSpec } from '../entities/es-spec.entity';
import { LoggingException } from '@us-epa-camd/easey-common/exceptions';
import { ErrorSuppressionsPayloadDTO } from '../dto/error-suppressions-payload.dto';

const mockRepository = () => ({
  getErrorSuppressions: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});
const mockMap = () => ({
  many: jest.fn(),
  one: jest.fn(),
});

describe('-- Error Suppressions Service --', () => {
  let service: ErrorSuppressionsService;
  let map: any;
  let repository: any;

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
        LoggingException,
      );
    });
  });
});
