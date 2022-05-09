import { Injectable } from '@nestjs/common';

import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { BulkFileDTO } from 'src/dto/bulk_file.dto';
import { BulkFileMetadata } from 'src/entities/bulk_file_metadata.entity';

@Injectable()
export class BulkFileMap extends BaseMap<BulkFileMetadata, BulkFileDTO> {
  public async one(entity: BulkFileMetadata): Promise<BulkFileDTO> {
    const splits = entity.s3_key.split('/');

    return {
      Id: entity.id,
      FileName: splits[splits.length - 1],
      Metadata: JSON.parse(entity.metadata),
      Bytes: entity.file_size,
      Kilobytes: entity.file_size / 1024,
      Megabytes: entity.file_size / 1024 / 1024,
      Gigabytes: entity.file_size / 1024 / 1024 / 1024,
      LastUpdated: entity.last_update_date,
    };
  }
}
