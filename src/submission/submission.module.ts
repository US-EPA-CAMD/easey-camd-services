import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { DataSetModule } from '../dataset/dataset.module';
import { SubmissionProcessService } from './submission-process.service';
import { CopyOfRecordModule } from '../copy-of-record/copy-of-record.module';

@Module({
  imports: [HttpModule, DataSetModule, CopyOfRecordModule],
  controllers: [SubmissionController],
  providers: [SubmissionService, SubmissionProcessService],
})
export class SubmissionModule {}
