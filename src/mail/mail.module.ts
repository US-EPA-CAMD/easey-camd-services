import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { join } from 'path';

@Module({
	imports: [
		MailerModule.forRootAsync({
			useFactory: async (config: ConfigService) => ({
				transport: {
					host: config.get<string>('app.smtpHost'),
					port: config.get<number>('app.smtpPort'),
					logger: false,
					debug: false,
					secure: false,
					tls: { rejectUnauthorized: false },
				},
				template: {
					dir: join(__dirname, 'templates'),
					adapter:new HandlebarsAdapter(),
					options: {
						strict: true,
					},
				},
			}),
			inject: [ConfigService],
		}),
	],
	controllers: [MailController],
	providers: [MailService],
	exports: [MailService],
})
export class MailModule {}
