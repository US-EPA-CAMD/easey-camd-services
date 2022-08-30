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

@Entity({ name: 'camdecmpsaux.report_detail' })
export class ReportDetail extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'report_detail_id',
  })
  id: number;

  @Column({
    name: 'report_cd',
  })
  reportCode: string;

  @Column({
    name: 'sequence_number',
  })
  sequenceNumber: number;

  @Column({
    name: 'detail_title',
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
  @JoinColumn({ name: 'report_cd' })
  report: Report;

  @OneToMany(
    () => ReportColumn,
    o => o.detail,
  )
  @JoinColumn({ name: 'report_detail_id' })
  columns: ReportColumn[];

  @OneToMany(
    () => ReportParameter,
    o => o.detail,
  )
  @JoinColumn({ name: 'report_detail_id' })
  parameters: ReportParameter[];
}
