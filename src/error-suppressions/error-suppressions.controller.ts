import { Controller, UseGuards } from '@nestjs/common';
import { Body, Get, Post, Query } from '@nestjs/common/decorators';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { ErrorSuppressionsService } from './error-suppressions.service';
import { ErrorSuppressionsDTO } from '../dto/error-suppressions.dto';
import { ErrorSuppressionsParamsDTO } from '../dto/error-suppressions.params.dto';
import { AuthGuard } from '@us-epa-camd/easey-common/guards';
import { ErrorSuppressionsPayloadDTO } from '../dto/error-suppressions-payload.dto';
import {
  BadRequestResponse,
  NotFoundResponse,
} from '../utils/swagger-decorator.const';
import { User } from '@us-epa-camd/easey-common/decorators';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces/current-user.interface';

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

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Token')
  @ApiCreatedResponse()
  async createErrorSuppressions(
    @Body() payload: ErrorSuppressionsPayloadDTO,
    @User() user: CurrentUser,
  ) {
    return this.service.createErrorSuppressions(payload, user.userId);
  }
}
