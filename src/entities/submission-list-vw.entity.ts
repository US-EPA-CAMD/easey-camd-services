import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';
import { BaseEntity, Column, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'camdecmpsaux.vw_submission_list' })
export class SubmissionListView extends BaseEntity {

  @Column({
    name: 'oris_code',
    transformer: new NumericColumnTransformer(),
    type: 'numeric',
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
    name: 'qa_data_type_cd',
  })
  qaDataTypeCode: string;

  @Column({
    name: 'test_type_cd',
  })
  testTypeCode: string;

  @Column({
    name: 'locations',
  })
  locations: string;

    @Column({
    name: 'reporting_period',
  })
  reportingPeriod: string;
  
  @Column({
    name: 'identifying_information',
  })
  identifyingInformation: string;

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
    type: 'numeric',
  })
  submissionId: number;

  @Column({
    name: 'queued_time',
    type: 'timestamp',
  })
  submissionDateTime: Date;

  @Column({
    name: 'severity_level',
  })
  severityLevel: string; 

  @Column({
    name: 'most_recent',
  })
  mostRecent: string;

  @Column({
    name: 'submission_status',
  })
  submissionStatus: string;

  @Column({
    name: 'severity_cd',
  })
  severityCode: string;

  @Column({
    name: 'submitter',
  })
  submitter: string;

  @Column({
    name: 'mon_plan_id',
    transformer: new NumericColumnTransformer(),
    type: 'numeric',
  })
  monitorPlanId: number;

  @Column({
    name: 'rpt_period_id',
    transformer: new NumericColumnTransformer(),
    type: 'numeric',
  })
  reportingPeriodId: number;
}
