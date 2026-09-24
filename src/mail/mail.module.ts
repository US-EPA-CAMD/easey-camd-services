import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { NodemailerModule } from './nodemailer/nodemailer.module';
import { EvaluationReportService } from './evaluation-report.service';
import { EaseyContentTemplateService } from './easey-content-template.service';
import { MailService } from './mail.service';
import { EmailToSendService } from './email-to-send.service';
import { ClientConfigService } from './client-config.service';
import { DataSetModule } from '../dataset/dataset.module';
import { CopyOfRecordModule } from '../copy-of-record/copy-of-record.module';
import { RecipientListService } from '../submission/recipient-list.service';
import { ClientTokenModule } from '../client-token/client-token.module';

@Module({
  imports: [
    HttpModule,
    NodemailerModule,
    DataSetModule,
    CopyOfRecordModule,
    ClientTokenModule,
  ],
  controllers: [MailController],
  providers: [
    EvaluationReportService, 
    EaseyContentTemplateService, 
    MailService, 
    EmailToSendService,
    ClientConfigService,
    RecipientListService
  ],
  exports: [
    EvaluationReportService, 
    RecipientListService, 
    EaseyContentTemplateService, 
    MailService, 
    EmailToSendService,
    ClientConfigService
  ],
})
export class MailModule {}
