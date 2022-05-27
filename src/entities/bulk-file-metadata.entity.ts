import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdaux.bulk_file_metadata' })
export class BulkFileMetadata extends BaseEntity {
  @PrimaryColumn({
    name: 'file_name',
  })
  fileName: string;

  @Column({
    name: 's3_path',
  })
  s3Path: string;

  @Column({
    name: 'metadata',
  })
  metadata: string;

  @Column({
    name: 'file_size',
  })
  fileSize: number;

  @Column({
    name: 'add_date',
  })
  addDate: Date;

  @Column({
    name: 'last_update_date',
  })
  lastUpdateDate: Date;
}
