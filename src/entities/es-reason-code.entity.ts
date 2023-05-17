import { BaseEntity, Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'camdecmpsmd.es_reason_code' })
export class EsReasonCode extends BaseEntity {
  @PrimaryColumn({ name: 'es_reason_cd' })
  reasonCode: string;

  @Column({ name: 'es_reason_description' })
  reasonCodeDescription: string;
}
