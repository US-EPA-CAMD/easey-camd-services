import { ApiTags, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common'; 
import { CreateMailDto } from './../dto/create-mail.dto';
import { MailService } from './mail.service';
import { Mail } from './../interfaces/mail.interface';

@ApiTags('Mail')
@Controller()
export class MailController {
	constructor(private mailService: MailService) {}

	@Post()
	@ApiOkResponse({
		description: 'Sends email',
	})
	async send(@Body() createMailDto: CreateMailDto) {
		this.mailService.sendEmail(createMailDto);
	}

}