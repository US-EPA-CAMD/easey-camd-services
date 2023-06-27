import { BaseEntity, Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'camdecmpsmd.es_match_data_type_code' })
export class EsMatchDataTypeCode extends BaseEntity {
  @PrimaryColumn({ name: 'es_match_data_type_cd' })
  matchDataTypeCode: string;

  @Column({ name: 'es_match_data_type_description' })
  matchDataTypeCodeDescription: string;
}
