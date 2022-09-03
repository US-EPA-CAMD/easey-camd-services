import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import { ReportDetail } from './report-detail.entity';

@Entity({ name: 'camdecmpsaux.report_parameter' })
export class ReportParameter extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'report_parameter_id',
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
    name: 'default_value',
  })
  defaultValue: string;

  @Column({
    name: 'report_detail_id',
  })
  reportDetailId: number;

  @ManyToOne(
    () => ReportDetail,
    o => o.parameters,
  )
  @JoinColumn({ name: 'report_detail_id' })
  detail: ReportDetail;
}
