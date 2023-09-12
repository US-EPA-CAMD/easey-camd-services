import { Module } from '@nestjs/common';
import { CopyOfRecordService } from './copy-of-record.service';
import { CopyOfRecordController } from './copy-of-record.controller';
import { DataSetModule } from '../dataset/dataset.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [DataSetModule, HttpModule],
  controllers: [CopyOfRecordController],
  providers: [CopyOfRecordService],
  exports: [CopyOfRecordService],
})
export class CopyOfRecordModule {}
