import { Module } from '@nestjs/common';
import { MatsFileUploadService } from './mats-file-upload.service';
import { MatsFileUploadController } from './mats-file-upload.controller';

@Module({
  controllers: [MatsFileUploadController],
  providers: [MatsFileUploadService]
})
export class MatsFileUploadModule {}
