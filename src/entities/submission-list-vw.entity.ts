import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';
import { BaseEntity, Column, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'camdecmpsaux.vw_submission_list' })
export class SubmissionListView extends BaseEntity {

  @Column({
    name: 'oris_code',
    transformer: new NumericColumnTransformer(),
  })
  orisCode: number;

  @Column({
     name: 'facility_name',
   })
  facilityName: string;

  @Column({
    name: 'state',
  })
  state: string;

  @Column({
    name: 'locations',
  })
  locations: string;

  @Column({
    name: 'reporting_period',
  })
  reportingPeriod: string;

  @Column({
    name: 'reporting_frequency',
  })
  reportingFrequencyCode: string;

  @Column({
    name: 'process_cd',
  })
  submissionTypeCode: string;

  @Column({
    name: 'submission_id',
    transformer: new NumericColumnTransformer(),
  })
  submissionId: number;

  @Column({
    name: 'queued_time',
    type: 'date',
  })
  submissionDateTime: Date;

  @Column({
    name: 'severity_level',
  })
  severityLevel: string; 

  @Column({
    name: 'most_recent',
  })
  mostRecet: string;

  @Column({
    name: 'submission_status',
  })
  submissionStatus: string;

  @Column({
    name: 'severity_cd',
  })
  severityCode: string;

  @Column({
    name: 'severity_critical_1',
  })
  criticalErrLevelOne: string;

  @Column({
    name: 'severity_critical_2',
  })
  criticalErrLevelTwo: string;

  @Column({
    name: 'severity_non_critical',
  })
  nonCritical: string;

  @Column({
    name: 'severity_informational',
  })
  infoMessage: string;

  @Column({
    name: 'severity_administrative_override',
  })
  adminOverride: string;

  @Column({
    name: 'submitter',
  })
  submitter: string;

  @Column({
    name: 'mon_plan_id',
    transformer: new NumericColumnTransformer(),
  })
  monitorPlanId: number;

  @Column({
    name: 'rpt_period_id',
    transformer: new NumericColumnTransformer(),
  })
  reportingPeriodId: number;
}
