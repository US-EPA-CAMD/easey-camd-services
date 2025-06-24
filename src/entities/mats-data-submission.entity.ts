import { NumericColumnTransformer } from '@us-epa-camd/easey-common';
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'camdecmpsaux.mats_data_submission' })
export class MatsDataSubmission extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'mats_data_sub_id', type: 'bigint' })
  matsDataSubId: number;

  @Column({ name: 'mon_loc_id' })
  monLocId: string;

  @Column({ name: 'mats_rpt_type_cd' })
  matsRptTypeCd: string;

  @Column({ name: 'mats_avg_group_cd', nullable: true })
  matsAvgGroupCd: string;

  @Column({ name: 'test_number', nullable: true })
  testNumber: string;

  @Column({ name: 'test_date', type: 'date', nullable: true })
  testDate: Date;

  @Column({ name: 'test_comment', type: 'text', nullable: true })
  testComment: string;

  @Column({ name: 'year', type: 'smallint', nullable: true })
  year: number;

  @Column({ name: 'quarter', type: 'smallint', nullable: true })
  quarter: number;

  @Column({ name: 'original_sub_id', nullable: true })
  originalSubId: number;

  @Column({ name: 'fac_id', type: 'numeric', transformer: new NumericColumnTransformer() })
  facId: number;

  @Column({ name: 'mon_plan_id' })
  monPlanId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'user_email' })
  userEmail: string;

  @Column({ name: 'add_time', type: 'timestamp' })
  addTime: Date;

  @Column({ name: 'update_time', type: 'timestamp', nullable: true })
  updateTime: Date;

  @Column({ name: 'queued_time', type: 'timestamp', nullable: true })
  queuedTime: Date;

  @Column({ name: 'started_time', type: 'timestamp', nullable: true })
  startedTime: Date;

  @Column({ name: 'completed_time', type: 'timestamp', nullable: true })
  completedTime: Date;

  @Column({ name: 'note', type: 'text', nullable: true })
  note: string;

  @Column({ name: 'note_time', type: 'timestamp', nullable: true })
  noteTime: Date;

  @Column({ name: 'activity_id', nullable: true })
  activityId: string;
}