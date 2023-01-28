import {
  ApiTags,
  ApiOkResponse,
  ApiSecurity,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ClientTokenGuard } from '@us-epa-camd/easey-common/guards';

import { MailService } from './mail.service';
import { CreateMailDto } from './../dto/create-mail.dto';
import { ClientId } from '../decorators/client-id.decorator';
import { ApiExcludeControllerByEnv } from 'src/utilities/swagger-decorator.const';

@Controller()
@ApiTags('Support')
@ApiSecurity('APIKey')
@ApiSecurity('ClientId')
@ApiBearerAuth('ClientToken')
@UseGuards(ClientTokenGuard)
@ApiExcludeControllerByEnv()
export class MailController {
  constructor(private mailService: MailService) {}

  @Post('email')
  @ApiOkResponse({
    description: 'Data sent successfully',
  })
  @ApiOperation({
    description: "Sends an email to a CAMD support inbox determined by the Client Id."
  })
  @ApiInternalServerErrorResponse()
  async send(
    @Body() payload: CreateMailDto,
    @ClientId() clientId: string,
  ) {
    await this.mailService.sendEmail(clientId, payload);
  }
}
