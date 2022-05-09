import { Injectable } from '@nestjs/common';

import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { BulkFileDTO } from 'src/dto/bulk_file.dto';
import { BulkFileMetadata } from 'src/entities/bulk_file_metadata.entity';

@Injectable()
export class BulkFileMap extends BaseMap<BulkFileMetadata, BulkFileDTO> {
  public async one(entity: BulkFileMetadata): Promise<BulkFileDTO> {
    const splits = entity.s3_key.split('/');
    const metadata = JSON.parse(entity.metadata);

    const metaToLower = Object.fromEntries(
      Object.entries(metadata).map(([k, v]) => [k.toLowerCase(), v]),
    );

    return {
      id: entity.id,
      s3Path: entity.s3_key,
      filename: splits[splits.length - 1],
      metadata: metaToLower,
      bytes: entity.file_size,
      kiloBytes: entity.file_size / 1024,
      megaBytes: entity.file_size / 1024 / 1024,
      gigaBytes: entity.file_size / 1024 / 1024 / 1024,
      lastUpdated: entity.last_update_date,
    };
  }
}
