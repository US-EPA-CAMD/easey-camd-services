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
import { ServerErrorDto } from 'src/dto/server-error.dto';

@ApiSecurity('APIKey')
@ApiTags('Logging')
@ApiBearerAuth('ClientToken')
@ApiSecurity('ClientId')
@UseGuards(ClientTokenGuard)
@Controller()
export class LoggingController {
  constructor(private loggingService: LoggingService) {}

  @Post('error')
  @ApiOkResponse({
    description: 'Client error message handler',
  })
  @ApiInternalServerErrorResponse()
  async serverError(@Req() request, @Body() serverErrorDto: ServerErrorDto) {
    await this.loggingService.logServerError(request, serverErrorDto);
  }
}
