import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BulkFileMap } from 'src/maps/bulk-file-map';
import { BulkFileGAFTPCopyService } from './bulk-file-gaftp-copy.service';
import { BulkFileMetadataRepository } from './bulk-file.repository';
import { BulkFileService } from './bulk-file.service';
import { BulkFileController } from './bulk-file.controller';
import { BulkFileGaftpCopyRepository } from './bulk-file-gaftp-copy.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BulkFileMetadataRepository,
      BulkFileGaftpCopyRepository,
    ]),
    HttpModule,
  ],
  controllers: [BulkFileController],
  providers: [
    ConfigService,
    BulkFileMap,
    BulkFileGAFTPCopyService,
    BulkFileService,
  ],
  exports: [TypeOrmModule],
})
export class BulkFileModule {}
