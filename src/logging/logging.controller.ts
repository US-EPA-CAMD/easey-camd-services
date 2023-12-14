import {
  ApiTags,
  ApiOkResponse,
  ApiSecurity,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { ClientTokenGuard } from '@us-epa-camd/easey-common/guards';
import { ServerErrorDto } from '../dto/server-error.dto';
import { ApiExcludeControllerByEnv } from '../utilities/swagger-decorator.const';

@Controller()
@ApiTags('Logging')
@ApiSecurity('APIKey')
@ApiExcludeControllerByEnv()
@ApiSecurity('ClientId')
@ApiBearerAuth('ClientToken')
@UseGuards(ClientTokenGuard)
export class LoggingController {
  constructor(private loggingService: LoggingService) {}

  @Post('error')
  @ApiOkResponse({
    description: 'Logging services for CAMD applications',
  })
  @ApiInternalServerErrorResponse()
  async serverError(@Req() request, @Body() serverErrorDto: ServerErrorDto) {
    await this.loggingService.logServerError(request, serverErrorDto);
  }
}
