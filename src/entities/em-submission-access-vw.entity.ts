import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';
import { BaseEntity, Column, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'camdecmpsaux.vw_em_submission_access' })
export class EmSubmissionAccessView extends BaseEntity {
  @Column({
    name: 'em_sub_access_id',
    transformer: new NumericColumnTransformer(),
  })
  id: number;

  @Column({
    name: 'mon_plan_id',
  })
  monitorPlanId: string;

  @Column({
    name: 'rpt_period_id',
    transformer: new NumericColumnTransformer(),
  })
  reportingPeriodId: number;

  @Column({
    name: 'access_begin_date',
    type: 'date',
  })
  openDate: Date;

  @Column({
    name: 'access_end_date',
    type: 'date',
  })
  closeDate: Date;

  @Column({
    name: 'em_sub_type_cd',
  })
  submissionTypeCode: string;

  @Column({
    name: 'em_sub_type_cd_description',
  })
  submissionTypeDescription: string;


  @Column({
    name: 'userid',
  })
  userid: string;

  @Column({
    name: 'add_date',
  })
  addDate: Date;

  @Column({ name: 'update_date' })
  updateDate: Date;

  @Column({
    name: 'em_status_cd',
  })
  emissionStatusCode: string;

  @Column({
    name: 'em_status_cd_description',
  })
  emissionStatusDescription: string;

  @Column({
    name: 'sub_availability_cd',
  })
  submissionAvailabilityCode: string;

  @Column({
    name: 'sub_availability_cd_description',
  })
  submissionAvailabilityDescription: string;

  @Column({
    name: 'resub_explanation',
  })
  resubExplanation: string;

  @Column({
    name: 'fac_id',
    transformer: new NumericColumnTransformer(),
  })
  facilityId: number;

  @Column({
    name: 'oris_code',
    transformer: new NumericColumnTransformer(),
  })
  orisCode: number;

  @Column({ name: 'facility_name' })
  facilityName: string;

  @Column({
    name: 'state',
  })
  state: string;

  @Column({
    name: 'calendar_year',
    transformer: new NumericColumnTransformer(),
  })
  year: number;

  @Column({ name: 'quarter', transformer: new NumericColumnTransformer() })
  quarter: number;

  @Column({ name: 'report_freq_cd' })
  reportingFrequencyCode: string;

  @Column({ name: 'period_abbreviation' })
  reportingPeriodAbbreviation: string;

  @Column({
    name: 'submission_id',
    transformer: new NumericColumnTransformer(),
  })
  lastSubmissionId: number;

  @Column({ name: 'severity_cd_description' })
  severityLevel: string;

  @Column({ name: 'locations' })
  locations: string;
}
