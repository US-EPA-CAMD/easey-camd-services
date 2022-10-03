import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import { ReportDetail } from './report-detail.entity';

@Entity({ name: 'camdaux.dataparameter' })
export class ReportParameter extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'parameter_id',
  })
  id: number;

  @Column({
    name: 'parameter_order',
  })
  parameterOrder: number;

  @Column({
    name: 'name',
  })
  name: string;

  @Column({
    name: 'default_value',
  })
  defaultValue: string;

  @Column({
    name: 'datatable_id',
  })
  reportDetailId: number;

  @ManyToOne(
    () => ReportDetail,
    o => o.parameters,
  )
  @JoinColumn({ name: 'datatable_id' })
  detail: ReportDetail;
}
