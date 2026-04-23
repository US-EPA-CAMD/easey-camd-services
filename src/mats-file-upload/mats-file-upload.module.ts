import { Module } from '@nestjs/common';
import { MatsFileUploadService } from './mats-file-upload.service';
import { MatsFileUploadController } from './mats-file-upload.controller';
import { HttpModule } from '@nestjs/axios';
import { CopyOfRecordModule } from '../copy-of-record/copy-of-record.module';
import { MailModule } from '../mail/mail.module';
import { DataSetModule } from '../dataset/dataset.module';
import { EvaluationSetHelperService } from '../evaluation/evaluation-set-helper.service';
import { SubmissionModule } from '../submission/submission.module';

@Module({
  imports: [HttpModule, CopyOfRecordModule, MailModule, DataSetModule, SubmissionModule],
  controllers: [MatsFileUploadController],
  providers: [MatsFileUploadService, EvaluationSetHelperService]
})
export class MatsFileUploadModule { }
