import { Injectable } from '@nestjs/common';

import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { BulkFileDTO } from 'src/dto/bulk_file.dto';
import { BulkFileMetadata } from 'src/entities/bulk-file-metadata.entity';

@Injectable()
export class BulkFileMap extends BaseMap<BulkFileMetadata, BulkFileDTO> {
  public async one(entity: BulkFileMetadata): Promise<BulkFileDTO> {
    const metadata = JSON.parse(entity.metadata);

    const metaToLower = Object.fromEntries(
      Object.entries(metadata).map(([k, v]) => [k.toLowerCase(), v]),
    );

    return {
      filename: entity.fileName,
      s3Path: entity.s3Path,
      metadata: metaToLower,
      bytes: entity.fileSize,
      kiloBytes: entity.fileSize / 1024,
      megaBytes: entity.fileSize / 1024 / 1024,
      gigaBytes: entity.fileSize / 1024 / 1024 / 1024,
      lastUpdated: entity.lastUpdateDate,
    };
  }
}
