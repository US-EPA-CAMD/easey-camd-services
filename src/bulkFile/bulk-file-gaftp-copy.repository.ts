import { EntityRepository, Repository } from 'typeorm';
import { SftpLog } from '../entities/sftp-log.entity';

@EntityRepository(SftpLog)
export class BulkFileGaftpCopyRepository extends Repository<SftpLog> {}
