import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpswks.emission_evaluation' })
export class EmissionEvaluation extends BaseEntity {
  @PrimaryColumn({ name: 'mon_plan_id' })
  monPlanId: string;

  @Column({ name: 'rpt_period_id' })
  rptPeriodId: number;

  @Column({ name: 'ch_session_id' })
  checkSessionId: number;
}
