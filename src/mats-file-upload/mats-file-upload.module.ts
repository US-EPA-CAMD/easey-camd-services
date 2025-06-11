import { Module } from '@nestjs/common';
import { MatsFileUploadService } from './mats-file-upload.service';
import { MatsFileUploadController } from './mats-file-upload.controller';
import { HttpModule } from '@nestjs/axios';
import { CopyOfRecordModule } from '../copy-of-record/copy-of-record.module';
import { MailModule } from '../mail/mail.module';
import { DocumentService } from '../submission/document.service';
import { DataSetModule } from '../dataset/dataset.module';

@Module({
  imports: [HttpModule, CopyOfRecordModule, MailModule, DataSetModule],
  controllers: [MatsFileUploadController],
  providers: [MatsFileUploadService, DocumentService]
})
export class MatsFileUploadModule { }
