import { BaseEntity, ViewColumn, ViewEntity } from 'typeorm';

import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';

@ViewEntity({ name: 'camdecmpsaux.vw_combined_submissions' })
export class CombinedSubmissions extends BaseEntity {
  @ViewColumn({ name: 'submission_id' })
  submissionIdentifier: any;

  @ViewColumn({ name: 'process_cd' })
  processCode: string;

  @ViewColumn({ name: 'severity_cd' })
  severityCode: string;

  @ViewColumn({
    name: 'fac_id',
    transformer: new NumericColumnTransformer(),
  })
  facIdentifier: number;

  @ViewColumn({ name: 'mon_plan_id' })
  monPlanIdentifier: string;

  @ViewColumn({
    name: 'rpt_period_id',
    transformer: new NumericColumnTransformer(),
  })
  rptPeriodIdentifier: number;

  @ViewColumn({ name: 'submission_set_id' })
  submissionSetIdentifier: string;

  @ViewColumn({ name: 'submitted_on' })
  submittedOn: Date;

  @ViewColumn({ name: 'user_id' })
  userIdentifier: string;

  @ViewColumn({ name: 'submission_end_stage_time' })
  submissionEndStateStageTime: Date;
}
