import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryColumn
} from 'typeorm';

import { ReportDetail } from './report-detail.entity';

@Entity({ name: 'camdaux.template_code' })
export class Template extends BaseEntity {
  @PrimaryColumn({
    name: 'template_cd',
  })
  code: string;

  @Column({
    name: 'group_cd',
  })
  groupCode: string;

  @Column({
    name: 'template_type',
  })
  type: string;

  @Column({
    name: 'display_name',
  })
  displayName: string;

  @OneToMany(
    () => ReportDetail,
    o => o.template,
  )
  @JoinColumn({ name: 'template_cd' })
  details: ReportDetail[];
}
