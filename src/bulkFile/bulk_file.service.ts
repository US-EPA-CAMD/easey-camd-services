import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { BulkFileDTO } from 'src/dto/bulk_file.dto';
import { BulkFileInputDTO } from 'src/dto/bulk_file_input.dto';
import { BulkFileMetadataRepository } from './bulk_file.repository';
import { BulkFileMap } from '../maps/bulk-file-map';
import { BulkFileMetadata } from 'src/entities/bulk_file_metadata.entity';

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
    const find = await this.repository.findOne({s3_key: bulkFileDTO.s3Path})
    if (find) {
      // return this.map.one(find);
      return this.putBulkDataFile(find.s3_key, bulkFileDTO)
    }
    else {
      const today = new Date();
      const databaseinput = new BulkFileMetadata();
      databaseinput.s3_key = bulkFileDTO.s3Path;
      databaseinput.metadata = JSON.stringify(bulkFileDTO.metadata);
      databaseinput.file_size = bulkFileDTO.bytes;
      databaseinput.add_date = today;
      databaseinput.last_update_date = today;
      await this.repository.insert(databaseinput);
      return this.map.one(await this.repository.findOne({s3_key: bulkFileDTO.s3Path}));
    }
  }

  async putBulkDataFile(s3_key: string, bulkFileDTO: BulkFileInputDTO): Promise<BulkFileDTO> {
    const databaseinput = await this.repository.findOne({s3_key: s3_key})
    databaseinput.metadata = JSON.stringify(bulkFileDTO.metadata);
    databaseinput.file_size = bulkFileDTO.bytes;
    databaseinput.last_update_date = new Date();
    await this.repository.update(databaseinput.id, databaseinput);
    return this.map.one(databaseinput);
  }
}
