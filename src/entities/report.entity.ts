import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryColumn
} from 'typeorm';

import { ReportDetail } from './report-detail.entity';

@Entity({ name: 'camdaux.dataset' })
export class Report extends BaseEntity {
  @PrimaryColumn({
    name: 'dataset_cd',
  })
  code: string;

  @Column({
    name: 'template_cd',
  })
  templateCode: string;

  @Column({
    name: 'display_name',
  })
  title: string;

  @Column({
    name: 'no_results_msg',
  })
  noResultsMessage: string;

  @OneToMany(
    () => ReportDetail,
    o => o.report,
  )
  @JoinColumn({ name: 'dataset_cd' })
  details: ReportDetail[];
}
