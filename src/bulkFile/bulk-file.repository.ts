import { BulkFileMetadata } from '../entities/bulk-file-metadata.entity';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(BulkFileMetadata)
export class BulkFileMetadataRepository extends Repository<BulkFileMetadata> {}
