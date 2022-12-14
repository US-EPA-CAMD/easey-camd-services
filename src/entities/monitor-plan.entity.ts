import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpswks.monitor_plan' })
export class MonitorPlan extends BaseEntity {
  @PrimaryColumn({ name: 'mon_plan_id' })
  id: string;

  @Column({ name: 'chk_session_id' })
  checkSessionId: string;

  @Column({ name: 'submission_availability_cd' })
  submissionAvailabilityCode: string;
}
