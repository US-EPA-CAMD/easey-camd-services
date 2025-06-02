import { BaseEntity, Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'camdecmpsmd.mats_data_file_type_code' })
export class MatsDataFileTypeCode extends BaseEntity {
  @PrimaryColumn({ name: 'mats_data_file_type_cd' })
  matsDataFileTypeCd: string;

  @Column({ name: 'mats_data_file_type_description' })
  matsDataFileTypeDescription: string;
}