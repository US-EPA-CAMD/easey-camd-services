import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpswks.emission_evaluation' })
export class EmissionEvaluation extends BaseEntity {
  @PrimaryColumn({ name: 'mon_plan_id' })
  monPlanId: string;

  @PrimaryColumn({ name: 'rpt_period_id' })
  rptPeriodId: string;

  @Column({ name: 'chk_session_id' })
  checkSessionId: string;

  @Column({ name: 'submission_availability_cd' })
  submissionAvailabilityCode: string;
}
