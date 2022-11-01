import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  ManyToOne,  
  PrimaryGeneratedColumn
} from 'typeorm';

import { Report } from './report.entity';
import { ReportColumn } from './report-column.entity';
import { ReportParameter } from './report-parameter.entity';

@Entity({ name: 'camdaux.datatable' })
export class ReportDetail extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'datatable_id',
  })
  id: number;

  @Column({
    name: 'dataset_cd',
  })
  reportCode: string;

  @Column({
    name: 'table_order',
  })
  detailOrder: number;

  @Column({
    name: 'display_name',
  })
  title: string;

  @Column({
    name: 'sql_statement',
  })
  sqlStatement: string;

  @Column({
    name: 'no_results_msg_override',
  })
  noResultsMessage: string;

  @ManyToOne(
    () => Report,
    o => o.details,
  )
  @JoinColumn({ name: 'dataset_cd' })
  report: Report;

  @OneToMany(
    () => ReportColumn,
    o => o.detail,
  )
  @JoinColumn({ name: 'datatable_id' })
  columns: ReportColumn[];

  @OneToMany(
    () => ReportParameter,
    o => o.detail,
  )
  @JoinColumn({ name: 'datatable_id' })
  parameters: ReportParameter[];
}
