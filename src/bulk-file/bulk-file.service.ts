import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { BulkFileDTO } from '../dto/bulk_file.dto';
import { BulkFileInputDTO } from '../dto/bulk_file_input.dto';
import { BulkFileMetadataRepository } from './bulk-file.repository';
import { BulkFileMap } from '../maps/bulk-file-map';
import { BulkFileMetadata } from '../entities/bulk-file-metadata.entity';

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
    let record = await this.repository.findOne({ s3Path: bulkFileDTO.s3Path });

    if (record) {
      return this.updateBulkDataFile(record.s3Path, bulkFileDTO);
    }

    const today = new Date();
    record = new BulkFileMetadata();

    record.filename = bulkFileDTO.filename;
    record.s3Path = bulkFileDTO.s3Path;
    record.metadata = JSON.stringify(bulkFileDTO.metadata);
    record.fileSize = bulkFileDTO.bytes;
    record.addDate = today;
    record.lastUpdateDate = today;

    await this.repository.insert(record);
    return this.map.one(record);
  }

  async updateBulkDataFile(
    s3Path: string,
    bulkFileDTO: BulkFileInputDTO,
  ): Promise<BulkFileDTO> {
    const record = await this.repository.findOne({ s3Path });

    if (record) {
      record.filename = bulkFileDTO.filename;
      record.s3Path = bulkFileDTO.s3Path;
      record.metadata = JSON.stringify(bulkFileDTO.metadata);
      record.fileSize = bulkFileDTO.bytes;
      record.lastUpdateDate = new Date();
      await this.repository.update(record.filename, record);
      return this.map.one(record);
    }

    return this.addBulkDataFile(bulkFileDTO);
  }

  async deleteBulkDataFile(s3Path: string): Promise<void> {
    const record = await this.repository.findOne({ s3Path });

    if (record && record.s3Path === s3Path) {
      await this.repository.delete(record);
    }
  }
}
