import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BulkFileMetadata } from '../entities/bulk-file-metadata.entity';
import { BulkFileMap } from '../maps/bulk-file-map';
import { BulkFileController } from './bulk-file.controller';
import { BulkFileMetadataRepository } from './bulk-file.repository';
import { BulkFileService } from './bulk-file.service';
import { MassBulkFileService } from './mass-bulk-file.service';

@Module({
  imports: [TypeOrmModule.forFeature([BulkFileMetadata]), HttpModule],
  controllers: [BulkFileController],
  providers: [
    ConfigService,
    BulkFileMap,
    BulkFileService,
    BulkFileMetadataRepository,
    MassBulkFileService,
  ],
  exports: [TypeOrmModule],
})
export class BulkFileModule {}
