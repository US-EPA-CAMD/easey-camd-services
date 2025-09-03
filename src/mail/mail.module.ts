import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { NodemailerModule } from './nodemailer/nodemailer.module';
import { TemplateService } from './template/template.service';
import { MailEvalService } from './mail-eval.service';
import { EaseyContentTemplateService } from './easey-content-template.service';
import { DataSetModule } from '../dataset/dataset.module';
import { CopyOfRecordModule } from '../copy-of-record/copy-of-record.module';
import { RecipientListService } from '../submission/recipient-list.service';

@Module({
  imports: [
    HttpModule,
    NodemailerModule,
    DataSetModule,
    CopyOfRecordModule,
  ],
  controllers: [MailController],
  providers: [MailService, MailEvalService, EaseyContentTemplateService, TemplateService, RecipientListService],
  exports: [MailEvalService, RecipientListService],
})
export class MailModule {}
