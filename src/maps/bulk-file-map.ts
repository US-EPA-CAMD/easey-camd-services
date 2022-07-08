import { Injectable } from '@nestjs/common';

import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { BulkFileDTO } from 'src/dto/bulk_file.dto';
import { BulkFileMetadata } from 'src/entities/bulk-file-metadata.entity';

@Injectable()
export class BulkFileMap extends BaseMap<BulkFileMetadata, BulkFileDTO> {
  public async one(entity: BulkFileMetadata): Promise<BulkFileDTO> {
    return {
      filename: entity.fileName,
      s3Path: entity.s3Path,
      metadata: JSON.parse(entity.metadata),
      bytes: entity.fileSize,
      kiloBytes: +(entity.fileSize / 1024).toFixed(1),
      megaBytes: +(entity.fileSize / 1024 / 1024).toFixed(1),
      gigaBytes: +(entity.fileSize / 1024 / 1024 / 1024).toFixed(1),
      lastUpdated: entity.lastUpdateDate,
    };
  }
}
