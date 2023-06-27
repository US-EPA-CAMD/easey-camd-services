import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';
import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  ViewEntity,
} from 'typeorm';

@ViewEntity({ name: 'camdecmpsaux.em_submission_access' })
export class EmSubmissionAccess extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'em_sub_access_id',
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
    name: 'resub_explanation',
  })
  resubExplanation: string;

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
    name: 'data_loaded_flg',
  })
  dataLoadedFlag: string;

  @Column({
    name: 'sub_availability_cd',
  })
  submissionAvailabilityCode;
}
