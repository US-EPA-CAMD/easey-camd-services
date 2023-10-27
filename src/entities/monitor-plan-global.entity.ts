import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';

@Entity({ name: 'camdecmps.monitor_plan' })
export class MonitorPlanGlobal extends BaseEntity {
  @PrimaryColumn({ name: 'mon_plan_id' })
  monPlanIdentifier: string;

  @Column({
    name: 'fac_id',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  facIdentifier: number;

  @Column({ name: 'config_type_cd' })
  configTypeCode: string;

  @Column({ name: 'last_updated' })
  lastUpdated: string;

  @Column({ name: 'updated_status_flg' })
  updatedStatusFLG: string;

  @Column({ name: 'needs_eval_flg' })
  needsEvalFLG: string;

  @Column({ name: 'chk_session_id' })
  chkSessionIdentifier: string;

  @Column({ name: 'userid' })
  userid: string;

  @Column({ name: 'add_date' })
  addDate: string;

  @Column({ name: 'update_date' })
  updateDate: string;

  @Column({
    name: 'submission_id',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  submissionIdentifier: number;

  @Column({ name: 'submission_availability_cd' })
  submissionAvailabilityCode: string;

  @Column({
    name: 'begin_rpt_period_id',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  beginRPTPeriodIdentifier: number;

  @Column({
    name: 'end_rpt_period_id',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  endRPTPeriodIdentifier: number;

  @Column({ name: 'last_evaluated_date' })
  lastEvaluatedDate: string;
}
