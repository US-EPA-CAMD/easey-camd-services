import { Controller } from '@nestjs/common';
import { Get, Param, Put, Query, UseGuards } from '@nestjs/common/decorators';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';
import { User } from '@us-epa-camd/easey-common/decorators';
import { AuthGuard } from '@us-epa-camd/easey-common/guards';
import { ErrorSuppressionsService } from './error-suppressions.service';
import { ErrorSuppressionsDTO } from '../dto/error-suppressions-dto';
import { ErrorSuppressionsParamsDTO } from '../dto/error-suppressions.params.dto';
import {
  ApiExcludeControllerByEnv,
  BadRequestResponse,
  NotFoundResponse,
} from '../utilities/swagger-decorator.const';

@Controller()
@ApiSecurity('APIKey')
@ApiTags('Error Suppressions')
@ApiExcludeControllerByEnv()
export class ErrorSuppressionsController {
  constructor(private service: ErrorSuppressionsService) { }

  @Get()
  @ApiOkResponse({
    isArray: true,
    type: ErrorSuppressionsDTO,
    description: 'Data retrieved successfully',
  })
  @NotFoundResponse()
  @BadRequestResponse()
  @ApiQuery({
    style: 'pipeDelimited',
    name: 'locations',
    required: false,
    explode: false,
  })
  @ApiOperation({
    description: 'Retrieves Error Suppressions per filter criteria.',
  })
  getErrorSuppressions(
    @Query() errorSuppressionsParamsDTO: ErrorSuppressionsParamsDTO,
  ): Promise<ErrorSuppressionsDTO[]> {
    return this.service.getErrorSuppressions(errorSuppressionsParamsDTO);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Deactivates the Error Suppression Record'
  })
  deactivateErrorSuppression(@Param('id') id: number, @User() user: CurrentUser): Promise<ErrorSuppressionsDTO> {
    return this.service.deactivateErrorSuppression(id);
  }

}


