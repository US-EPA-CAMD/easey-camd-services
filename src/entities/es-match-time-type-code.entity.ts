import { BaseEntity, Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'camdecmpsmd.es_match_time_type_code' })
export class EsMatchTimeTypeCode extends BaseEntity {
  @PrimaryColumn({ name: 'es_match_time_type_cd' })
  matchTimeTypeCode: string;

  @Column({ name: 'es_match_time_type_description' })
  matchTimeTypeCodeDescription: string;
}
