import {
  ApiTags,
  ApiOkResponse,
  ApiSecurity,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { Controller, Post, Body } from '@nestjs/common';
import { CreateMailDto } from './../dto/create-mail.dto';
import { MailService } from './mail.service';

@ApiSecurity('APIKey')
@ApiTags('Email')
@Controller()
export class MailController {
  constructor(private mailService: MailService) {}

  @Post()
  @ApiOkResponse({
    description: 'Successfully sent email',
  })
  @ApiInternalServerErrorResponse()
  async send(@Body() createMailDto: CreateMailDto) {
    await this.mailService.sendEmail(createMailDto);
  }
}
