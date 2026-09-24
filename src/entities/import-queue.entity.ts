import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';

import { ImportSet } from './import-set.entity';
import { ReportingPeriod } from './reporting-period.entity';

@Entity({ name: 'camdecmpsaux.import_queue' })
export class ImportQueue extends BaseEntity {
  @PrimaryColumn({ name: 'import_id' })
  importId: number;

  @Column({ name: 'import_set_id' })
  importSetId: string;

  @Column({ name: 'mon_plan_id' })
  monPlanId: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'temp_s3_bucket_file_path' })
  tempS3BucketFilePath: string;

  @Column({ name: 'file_type_cd' })
  fileTypeCode: string;

  @Column({
    name: 'oris_code',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  orisCode: number;

  @Column({
    name: 'rpt_period_id',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  rptPeriodId?: number;

  @Column({ name: 'queued_time' })
  queuedTime: Date;

  @Column({ name: 'started_time' })
  startedTime?: Date;

  @Column({ name: 'completed_time' })
  completedTime?: Date;

  @Column({ name: 'note' })
  note?: string;

  @Column({ name: 'note_time' })
  noteTime?: Date;

  // Generated column - read-only.
  @Column({ name: 'status_cd', insert: false, update: false })
  statusCode: string;

  @ManyToOne(() => ImportSet)
  @JoinColumn({ name: 'import_set_id' })
  importSet: ImportSet;

  @ManyToOne(() => ReportingPeriod)
  @JoinColumn({ name: 'rpt_period_id' })
  reportingPeriod: ReportingPeriod;
}
