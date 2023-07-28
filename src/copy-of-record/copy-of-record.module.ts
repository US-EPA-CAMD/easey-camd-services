import { Module } from '@nestjs/common';
import { CopyOfRecordService } from './copy-of-record.service';

@Module({
  imports: [],
  providers: [CopyOfRecordService],
  exports: [CopyOfRecordService],
})
export class CopyOfRecordModule {}
