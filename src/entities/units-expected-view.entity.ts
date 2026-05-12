import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';
import { BaseEntity, Column, ViewEntity } from 'typeorm';

@ViewEntity({ 
  name: 'camdecmpsaux.get_units_expected_to_submit_report_data',
  expression: `SELECT * FROM camdecmpsaux.get_units_expected_to_submit_report_data(NULL, NULL, NULL, NULL, NULL, NULL, NULL)`
})
export class UnitsExpectedView extends BaseEntity {
  @Column({
    name: 'oris_code',
    transformer: new NumericColumnTransformer(),
    type: 'numeric',
  })
  facilityId: number;

  @Column({
    name: 'facility_name',
  })
  facilityName: string;

  @Column({
    name: 'state',
  })
  stateCode: string;

  @Column({
    name: 'unitid',
  })
  unitId: string;

  @Column({
    name: 'locations',
    type: 'text',
  })
  locations: string;

  @Column({
    name: 'em_sub_type_cd_description',
  })
  submissionTypeDescription: string;

  @Column({
    name: 'access_begin_date',
    type: 'date',
  })
  accessBeginDate: Date;

  @Column({
    name: 'access_end_date',
    type: 'date',
  })
  accessEndDate: Date;

  @Column({
    name: 'window_status',
    type: 'text',
  })
  windowStatus: string;

  @Column({
    name: 'submission_status',
    type: 'text',
  })
  submissionStatus: string;

  @Column({
    name: 'submission_id',
    transformer: new NumericColumnTransformer(),
    type: 'bigint',
  })
  submissionId: number;

  @Column({
    name: 'submission_date',
    type: 'timestamp',
  })
  submissionDate: Date;

  @Column({
    name: 'severity_cd_description',
  })
  severityDescription: string;
  
  subRecords: any;
}