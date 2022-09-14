import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import { ReportDetail } from './report-detail.entity';

@Entity({ name: 'camdecmpsaux.datacolumn' })
export class ReportColumn extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'datacolumn_id',
  })
  id: number;

  @Column({
    name: 'column_order',
  })
  columnOrder: number;

  @Column({
    name: 'name',
  })
  name: string;

  @Column({
    name: 'display_name',
  })
  displayName: string;

  @Column({
    name: 'datatable_id',
  })
  reportDetailId: number;

  @ManyToOne(
    () => ReportDetail,
    o => o.columns,
  )
  @JoinColumn({ name: 'datatable_id' })
  detail: ReportDetail;
}
