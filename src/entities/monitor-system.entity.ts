import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';

@Entity({ name: 'camdecmpswks.monitor_system' })
export class MonitorSystem extends BaseEntity {
  @PrimaryColumn({ name: 'mon_sys_id' })
  monSystemIdentifier: string;

  @Column({ name: 'mon_loc_id' })
  monLOCIdentifier: string;

  @Column({ name: 'system_identifier' })
  systemIdentifier: string;

  @Column({ name: 'sys_type_cd' })
  systemTypeCode: string;

  @Column({ name: 'begin_date' })
  beginDate: string;

  @Column({
    name: 'begin_hour',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  beginHour: number;

  @Column({ name: 'end_date' })
  endDate: string;

  @Column({
    name: 'end_hour',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  endHour: number;

  @Column({ name: 'sys_designation_cd' })
  systemDesignationCode: string;

  @Column({ name: 'fuel_cd' })
  fuelCode: string;

  @Column({ name: 'userid' })
  userid: string;

  @Column({ name: 'add_date' })
  addDate: string;

  @Column({ name: 'update_date' })
  updateDate: string;
}
