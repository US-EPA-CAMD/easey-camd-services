import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { BulkFileDTO } from 'src/dto/bulk_file.dto';
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
}
