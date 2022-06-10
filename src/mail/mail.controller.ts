import {
  ApiTags,
  ApiOkResponse,
  ApiSecurity,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { CreateMailDto } from './../dto/create-mail.dto';
import { MailService } from './mail.service';
import { ClientTokenGuard } from '@us-epa-camd/easey-common/guards';

@ApiSecurity('APIKey')
@ApiTags('Support')
@ApiBearerAuth('ClientToken')
@ApiSecurity('ClientId')
@UseGuards(ClientTokenGuard)
@Controller()
export class MailController {
  constructor(private mailService: MailService) {}

  @Post('email')
  @ApiOkResponse({
    description: 'Successfully sent email',
  })
  @ApiInternalServerErrorResponse()
  async send(@Req() request, @Body() createMailDto: CreateMailDto) {
    await this.mailService.sendEmail(request, createMailDto);
  }
}
