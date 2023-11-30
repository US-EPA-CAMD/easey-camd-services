import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { smtpHost, smtpPort } from '../config/app.config';
import { join } from 'path';
import { MailEvalService } from './mail-eval.service';
import { MailTemplateService } from './mail-template.service';
import { DataSetModule } from '../dataset/dataset.module';
import { CopyOfRecordModule } from '../copy-of-record/copy-of-record.module';

@Module({
  imports: [
    HttpModule,
    MailerModule.forRoot({
      transport: {
        host: smtpHost,
        port: smtpPort,
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
    DataSetModule,
    CopyOfRecordModule,
  ],
  controllers: [MailController],
  providers: [MailService, MailEvalService, MailTemplateService],
  exports: [MailEvalService],
})
export class MailModule {}
