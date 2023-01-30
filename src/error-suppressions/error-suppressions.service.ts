import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggingException } from '@us-epa-camd/easey-common/exceptions';

import { ErrorSuppressionsRepository } from './error-suppressions.repository';
import { ErrorSuppressionsParamsDTO } from '../dto/error-suppressions.params.dto';
import { ErrorSuppressionsDTO } from '../dto/error-suppressions.dto';
import { ErrorSuppressionsMap } from '../maps/error-suppressions.map';
import { EsSpec } from '../entities/es-spec.entity';
import { ErrorSuppressionsPayloadDTO } from '../dto/error-suppressions-payload.dto';

@Injectable()
export class ErrorSuppressionsService {
  constructor(
    @InjectRepository(ErrorSuppressionsRepository)
    private readonly repository: ErrorSuppressionsRepository,
    private readonly map: ErrorSuppressionsMap,
  ) {}

  async getErrorSuppressions(
    params: ErrorSuppressionsParamsDTO,
  ): Promise<ErrorSuppressionsDTO[]> {
    let query;
    try {
      query = await this.repository.getErrorSuppressions(params);
    } catch (e) {
      throw new LoggingException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return this.map.many(query);
  }

  async deactivateErrorSuppression(id: number): Promise<ErrorSuppressionsDTO> {
    let recordToUpdate: EsSpec;

    try {
      recordToUpdate = await this.repository.findOne(id, {
        relations: [
          'checkCatalogResult',
          'plant',
          'checkCatalogResult.checkCatalog',
        ],
      });
      if (!recordToUpdate)
        throw new LoggingException(
          `Record with id ${id} not found`,
          HttpStatus.NOT_FOUND,
        );

      recordToUpdate.active = 0;
      await this.repository.save(recordToUpdate);
    } catch (e) {
      throw new LoggingException(e.message, e.status);
    }

    return this.map.one(recordToUpdate);
  }
  async createErrorSuppression(
    payload: ErrorSuppressionsPayloadDTO,
    userId?: string,
  ): Promise<ErrorSuppressionsDTO> {
    try {
      const entity = this.repository.create({
        ...payload,
        matchHistoricalIndicator: +payload.matchHistoricalIndicator,
        active: 1,
        di: null,
        addDate: new Date().toISOString(),
        userId: userId,
      });

      await this.repository.save(entity);
      const errorSuppression = await this.repository.findOne(entity?.id, {
        relations: [
          'checkCatalogResult',
          'plant',
          'checkCatalogResult.checkCatalog',
        ],
      });
      const dto = await this.map.one(errorSuppression);
      return dto;
    } catch (e) {
      throw new LoggingException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
