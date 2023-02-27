import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

@Module({
  imports: [
    HttpModule,
    MailerModule.forRoot({
      transport: {
        host: 'smtp-relay.sendinblue.com',
        port: 587,
        auth: {
          user: 'kyleherceg@gmail.com',
          pass: 'MWItOjU7FDXvsRah',
        },
      },
      defaults: {
        from: 'kyleherceg@gmail.com', // outgoing email ID
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(
          {
            equals: (a, b) => {
              return a === b;
            },
            notEquals: (a, b) => {
              return a !== b;
            },
          },
          {
            inlineCssEnabled: true,
          },
        ),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
})
export class MailModule {}
