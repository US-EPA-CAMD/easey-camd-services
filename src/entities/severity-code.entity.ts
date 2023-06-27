import { BaseEntity, Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'camdecmpsmd.severity_code' })
export class SeverityCode extends BaseEntity {
  @PrimaryColumn({ name: 'severity_cd' })
  severityCode: string;

  @Column({ name: 'severity_cd_description' })
  severityCodeDescription: string;
}
