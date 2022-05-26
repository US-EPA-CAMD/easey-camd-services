import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { BulkFileDTO } from 'src/dto/bulk_file.dto';
import { BulkFileInputDTO } from 'src/dto/bulk_file_input.dto';
import { BulkFileMetadataRepository } from './bulk_file.repository';
import { BulkFileMap } from '../maps/bulk-file-map';

@Injectable()
export class BulkFileService {
  constructor(
    @InjectRepository(BulkFileMetadataRepository)
    private readonly repository: BulkFileMetadataRepository,
    private readonly map: BulkFileMap,
    private readonly logger: Logger,
  ) {}

  async getBulkDataFiles(): Promise<BulkFileDTO[]> {
    return this.map.many(await this.repository.find());
  }

  async postBulkDataFile(bulkFileDTO: BulkFileInputDTO): Promise<BulkFileDTO> {
    var find = await this.repository.find({s3_key: bulkFileDTO.s3Path})
    if (find.length == 0) {
      var today = new Date();
      var databaseinput = {
        s3_key: bulkFileDTO.s3Path,
        metadata: JSON.stringify(bulkFileDTO.metadata),
        file_size: bulkFileDTO.bytes,
        add_date: today,
        last_update_date: today,
      }
      await this.repository.insert(databaseinput);
      return this.map.one(await this.repository.findOne({s3_key: bulkFileDTO.s3Path}));
    }
    else {
      return this.map.one(find[0]);
    }
  }

  async putBulkDataFile(id: number, bulkFileDTO: BulkFileInputDTO): Promise<BulkFileDTO> {
    var databaseinput = {
      s3_key: bulkFileDTO.s3Path,
      metadata: JSON.stringify(bulkFileDTO.metadata),
      file_size: bulkFileDTO.bytes,
      last_update_date: new Date(),
    };
    await this.repository.update(id, databaseinput);
    var find = await this.repository.findOne({id: id})
    return this.map.one(find);
  }
}
