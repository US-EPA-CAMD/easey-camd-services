import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import { DataTable } from './datatable.entity';

@Entity({ name: 'camdaux.dataparameter' })
export class DataParameter extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'parameter_id',
  })
  id: number;

  @Column({
    name: 'datatable_id',
  })
  dataTableId: number;

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
    () => DataTable,
    o => o.parameters,
  )
  @JoinColumn({ name: 'datatable_id' })
  dataTable: DataTable;
}
