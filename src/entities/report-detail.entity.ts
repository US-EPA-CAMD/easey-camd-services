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
import { Template } from './template.entity';
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
    name: 'template_cd',
  })
  templateCode: string;

  @Column({
    name: 'table_order',
  })
  detailOrder: number;

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

  @ManyToOne(
    () => Report,
    o => o.details,
  )
  @JoinColumn({ name: 'dataset_cd' })
  report: Report;

  @ManyToOne(
    () => Template,
    o => o.details,
  )
  @JoinColumn({ name: 'template_cd' })
  template: Template;

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
