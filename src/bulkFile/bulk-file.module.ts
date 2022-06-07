import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BulkFileMap } from 'src/maps/bulk-file-map';
import { BulkFileGAFTPCopyService } from './bulk-file-gaftp-copy.service';
import { BulkFileController } from './bulk-file.controller';
import { BulkFileMetadataRepository } from './bulk-file.repository';
import { BulkFileService } from './bulk-file.service';

@Module({
  imports: [TypeOrmModule.forFeature([BulkFileMetadataRepository])],
  controllers: [BulkFileController],
  providers: [
    ConfigService,
    BulkFileService,
    BulkFileMap,
    BulkFileGAFTPCopyService,
  ],
  exports: [TypeOrmModule],
})
export class BulkFileModule {}
