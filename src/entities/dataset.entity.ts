import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryColumn
} from 'typeorm';

import { DataTable } from './datatable.entity';

@Entity({ name: 'camdaux.dataset' })
export class DataSet extends BaseEntity {
  @PrimaryColumn({
    name: 'dataset_cd',
  })
  code: string;

  @Column({
    name: 'group_cd',
  })
  groupCode: string;

  @Column({
    name: 'display_name',
  })
  displayName: string;

  @Column({
    name: 'no_results_msg',
  })
  noResultsMessage: string;

  @OneToMany(
    () => DataTable,
    o => o.dataSet,
  )
  @JoinColumn({ name: 'dataset_cd' })
  tables: DataTable[];
}
