import { BaseEntity, Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity({ name: 'camdecmpsmd.severity_code' })
export class SeverityCode extends BaseEntity {
  @PrimaryColumn({ name: 'severity_cd' })
  severityCode: string;

  @Column({ name: 'severity_cd_description' })
  severityCodeDescription: string;

  @Column({ name: 'severity_level', type: 'numeric' })
  severityLevel: number;

  @Column({ name: 'es_type_ind', type: 'numeric', default: 1 })
  esTypeInd: number;

  @Column({ name: 'eval_status_cd', nullable: true })
  evalStatusCode: string;
}
