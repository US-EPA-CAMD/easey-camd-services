import { Controller } from '@nestjs/common';
import { Get, Query } from '@nestjs/common/decorators';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { ErrorSuppressionsService } from './error-suppressions.service';
import { ErrorSuppressionsDTO } from '../dto/error-suppressions-dto';
import { ErrorSuppressionsParamsDTO } from '../dto/error-suppressions.params.dto';
import {
  BadRequestResponse,
  NotFoundResponse,
} from '../utils/swagger-decorator.const';

@Controller()
@ApiTags('Error Suppressions')
export class ErrorSuppressionsController {
  constructor(private service: ErrorSuppressionsService) {}

  @Get()
  @ApiOkResponse({
    description: 'Retrieves Error Suppressions Per Filter Criteria',
  })
  @BadRequestResponse()
  @NotFoundResponse()
  @ApiExtraModels(ErrorSuppressionsDTO)
  @ApiQuery({
    style: 'pipeDelimited',
    name: 'locations',
    required: false,
    explode: false,
  })
  getErrorSuppressions(
    @Query() errorSuppressionsParamsDTO: ErrorSuppressionsParamsDTO,
  ): Promise<ErrorSuppressionsDTO[]> {
    return this.service.getErrorSuppressions(errorSuppressionsParamsDTO);
  }
}
