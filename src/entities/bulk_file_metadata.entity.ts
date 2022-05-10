import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'camdaux.bulk_file_metadata' })
export class BulkFileMetadata extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'bulk_file_id',
  })
  id: number;

  @Column({
    name: 's3_key',
  })
  s3_key: string;

  @Column({
    name: 'metadata',
  })
  metadata: string;

  @Column({
    name: 'file_size',
  })
  file_size: number;

  @Column({
    name: 'add_date',
  })
  add_date: Date;

  @Column({
    name: 'last_update_date',
  })
  last_update_date: Date;
}
