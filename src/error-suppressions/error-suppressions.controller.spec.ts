import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';

import { ErrorSuppressionsController } from './error-suppressions.controller';
import { ErrorSuppressionsService } from './error-suppressions.service';
import { ErrorSuppressionsRepository } from './error-suppressions.repository';
import { ErrorSuppressionsParamsDTO } from '../dto/error-suppressions.params.dto';
import { genErrorSuppressions } from '../../test/object-generators/error-suppressions';
import { ErrorSuppressionsDTO } from '../dto/error-suppressions-dto';
import { ErrorSuppressionsMap } from '../maps/error-suppressions.map';

jest.mock('@us-epa-camd/easey-common/guards');

describe('-- Error Suppressions Controller --', () => {
  let controller: ErrorSuppressionsController;
  let service: ErrorSuppressionsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      controllers: [ErrorSuppressionsController],
      providers: [
        ErrorSuppressionsService,
        ErrorSuppressionsRepository,
        ErrorSuppressionsMap,
      ],
    }).compile();

    controller = module.get(ErrorSuppressionsController);
    service = module.get(ErrorSuppressionsService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('* getErrorSuppressions', () => {
    it('calls ErrorSuppressionsService.getErrorSuppressions() and returns all error suppression data', async () => {
      const mockedValues = genErrorSuppressions<ErrorSuppressionsDTO>();
      const paramsDto = new ErrorSuppressionsParamsDTO();
      jest
        .spyOn(service, 'getErrorSuppressions')
        .mockResolvedValue(mockedValues);
      expect(await controller.getErrorSuppressions(paramsDto)).toBe(
        mockedValues,
      );
    });
  });

  describe('* deactivateErrorSuppression', () => {
    it('calls ErrorSuppressionsService.deactivateErrorSuppression() and returns updated row', async () => {
      const mockedValue = genErrorSuppressions<ErrorSuppressionsDTO>()[0];
      const paramsDto = new ErrorSuppressionsParamsDTO();

      const currentUser = {
        userId: "",
        sessionId: "",
        expiration: "",
        clientIp: "",
        isAdmin: true,
        permissionSet: []
      }

      jest
        .spyOn(service, 'deactivateErrorSuppression')
        .mockResolvedValue(mockedValue);
      expect(await controller.deactivateErrorSuppression(paramsDto.esId, currentUser)).toBe(
        mockedValue,
      );
    });
  });

});
