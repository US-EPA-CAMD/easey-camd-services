import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { BulkFileDTO } from 'src/dto/bulk_file.dto';
import { BulkFileInputDTO } from 'src/dto/bulk_file_input.dto';
import { BulkFileMetadataRepository } from './bulk-file.repository';
import { BulkFileMap } from '../maps/bulk-file-map';
import { BulkFileMetadata } from 'src/entities/bulk-file-metadata.entity';

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

  async addBulkDataFile(bulkFileDTO: BulkFileInputDTO): Promise<BulkFileDTO> {
    const find = await this.repository.findOne({ s3Path: bulkFileDTO.s3Path });
    if (find) {
      return this.updateBulkDataFile(find.s3Path, bulkFileDTO);
    } else {
      const today = new Date();
      const databaseInput = new BulkFileMetadata();

      databaseInput.fileName = bulkFileDTO.filename;
      databaseInput.s3Path = bulkFileDTO.s3Path;
      databaseInput.metadata = JSON.stringify(bulkFileDTO.metadata);
      databaseInput.fileSize = bulkFileDTO.bytes;
      databaseInput.addDate = today;
      databaseInput.lastUpdateDate = today;

      await this.repository.insert(databaseInput);
      return this.map.one(
        await this.repository.findOne({ s3Path: bulkFileDTO.s3Path }),
      );
    }
  }

  async updateBulkDataFile(
    s3_path: string,
    bulkFileDTO: BulkFileInputDTO,
  ): Promise<BulkFileDTO> {
    const databaseinput = await this.repository.findOne({ s3Path: s3_path });
    databaseinput.fileName = bulkFileDTO.filename;
    databaseinput.s3Path = bulkFileDTO.s3Path;
    databaseinput.metadata = JSON.stringify(bulkFileDTO.metadata);
    databaseinput.fileSize = bulkFileDTO.bytes;
    databaseinput.lastUpdateDate = new Date();
    await this.repository.update(databaseinput.fileName, databaseinput);
    return this.map.one(databaseinput);
  }
}
