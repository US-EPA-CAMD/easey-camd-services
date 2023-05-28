import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DataSet } from './dataset.entity';
import { Template } from './template.entity';
import { DataColumn } from './datacolumn.entity';
import { DataParameter } from './dataparameter.entity';

@Entity({ name: 'camdaux.datatable' })
export class DataTable extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'datatable_id',
  })
  id: number;

  @Column({
    name: 'dataset_cd',
  })
  dataSetCode: string;

  @Column({
    name: 'template_cd',
  })
  templateCode: string;

  @Column({
    name: 'table_order',
  })
  tableOrder: number;

  @Column({
    name: 'display_name',
  })
  displayName: string;

  @Column({
    name: 'sql_statement',
  })
  sqlStatement: string;

  @Column({
    name: 'no_results_msg_override',
  })
  noResultsMessage: string;

  @ManyToOne(() => DataSet, (o) => o.tables)
  @JoinColumn({ name: 'dataset_cd' })
  dataSet: DataSet;

  @ManyToOne(() => Template, (o) => o.dataTables)
  @JoinColumn({ name: 'template_cd' })
  template: Template;

  @OneToMany(() => DataColumn, (o) => o.dataTable)
  @JoinColumn({ name: 'datatable_id' })
  columns: DataColumn[];

  @OneToMany(() => DataParameter, (o) => o.dataTable)
  @JoinColumn({ name: 'datatable_id' })
  parameters: DataParameter[];
}
