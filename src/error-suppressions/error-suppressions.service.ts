import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggingException } from '@us-epa-camd/easey-common/exceptions';

import { ErrorSuppressionsRepository } from './error-suppressions.repository';
import { ErrorSuppressionsParamsDTO } from '../dto/error-suppressions.params.dto';
import { ErrorSuppressionsDTO } from '../dto/error-suppressions-dto';
import { ErrorSuppressionsMap } from '../maps/error-suppressions.map';

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
}
