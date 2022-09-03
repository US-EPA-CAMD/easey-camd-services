import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import { ReportDetail } from './report-detail.entity';

@Entity({ name: 'camdecmpsaux.report_column' })
export class ReportColumn extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'report_column_id',
  })
  id: number;

  @Column({
    name: 'sequence_number',
  })
  sequenceNumber: number;

  @Column({
    name: 'name',
  })
  name: string;

  @Column({
    name: 'display_name',
  })
  displayName: string;

  @Column({
    name: 'report_detail_id',
  })
  reportDetailId: number;

  @ManyToOne(
    () => ReportDetail,
    o => o.columns,
  )
  @JoinColumn({ name: 'report_detail_id' })
  detail: ReportDetail;
}
