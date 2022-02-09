import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { Controller, Post, Body } from '@nestjs/common';
import { CreateMailDto } from './../dto/create-mail.dto';
import { MailService } from './mail.service';

//@ApiSecurity('APIKey')
@ApiTags('email')
@Controller()
export class MailController {
  constructor(private mailService: MailService) {}

  @Post()
  @ApiOkResponse({
    description: 'Successfully sent email',
  })
  async send(@Body() createMailDto: CreateMailDto) {
    await this.mailService.sendEmail(createMailDto);
  }
}
