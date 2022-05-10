import { BulkFileMetadata } from '../entities/bulk_file_metadata.entity';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(BulkFileMetadata)
export class BulkFileMetadataRepository extends Repository<BulkFileMetadata> {}
