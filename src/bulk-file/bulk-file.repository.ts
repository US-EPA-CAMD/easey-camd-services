import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';

import { BulkFileMetadata } from '../entities/bulk-file-metadata.entity';

@Injectable()
export class BulkFileMetadataRepository extends Repository<BulkFileMetadata> {
  constructor(entityManager: EntityManager) {
    super(BulkFileMetadata, entityManager);
  }
}
