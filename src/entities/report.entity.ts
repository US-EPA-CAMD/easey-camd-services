import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryColumn
} from 'typeorm';

import { ReportDetail } from './report-detail.entity';

@Entity({ name: 'camdecmpsaux.report' })
export class Report extends BaseEntity {
  @PrimaryColumn({
    name: 'report_cd',
  })
  code: string;

  @Column({
    name: 'report_title',
  })
  title: string;

  @Column({
    name: 'report_template_cd',
  })
  templateCode: string;

  @Column({
    name: 'no_results_msg',
  })
  noResultsMessage: string;

  @OneToMany(
    () => ReportDetail,
    o => o.report,
  )
  @JoinColumn({ name: 'report_cd' })
  details: ReportDetail[];
}
