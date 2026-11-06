import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';

@Entity({ name: 'camdecmps.emission_evaluation' })
export class EmissionEvaluationGlobal extends BaseEntity {
  @PrimaryColumn({ name: 'mon_plan_id' })
  monPlanIdentifier: string;

  @PrimaryColumn({
    name: 'rpt_period_id',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  rptPeriodIdentifier: number;

  @Column({ name: 'last_updated' })
  lastUpdated: string;

  @Column({ name: 'updated_status_flg' })
  updatedStatusFLG: string;

  @Column({ name: 'needs_eval_flg' })
  needsEvalFLG: string;

  @Column({ name: 'chk_session_id' })
  chkSessionIdentifier: string;

  @Column({
    name: 'submission_id',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  submissionIdentifier: number;

  @Column({ name: 'submission_availability_cd' })
  submissionAvailabilityCode: string;
}
