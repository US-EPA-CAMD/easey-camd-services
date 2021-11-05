import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { Mail } from './../interfaces/mail.interface';

@Injectable()
export class MailService {
	constructor(private mailerService: MailerService) {}

	private readonly mail: Mail[]  = [];

	async sendEmail(mail: Mail) {
		const url = 'www.google.com';

		// curl -X POST -d "toEmail=yefim@yefim-VirtualBox&fromEmail=from@otherexample.com&subject=test subject&body=test body" http://localhost:3000/mail
		console.log(mail);

		await this.mailerService.sendMail({
			to: mail.toEmail,
			subject: mail.subject,
			template: './testTemplate',
			// "Yefim Test" <yefim@yefim-VirtualBox.com>'
			from: `'Test Contact Us' <${mail.fromEmail}>`,
			context: {
				url
			},
		});
	}

	create(mail: Mail) {
		this.mail.push(mail);
	}

	findAll(): Mail[] {
		return this.mail;
	}
}
