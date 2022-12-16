import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpswks.check_session' })
export class CheckSession extends BaseEntity {
  @PrimaryColumn({ name: 'chk_session_id' })
  id: string;

  @Column({ name: 'severity_cd' })
  severityCode: string;
}
