import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';

@Entity({ name: 'camdecmpswks.monitor_location' })
export class MonitorLocation extends BaseEntity {
  @PrimaryColumn({ name: 'mon_loc_id' })
  monLocIdentifier: string;

  @Column({ name: 'stack_pipe_id' })
  stackPipeIdentifier: string;

  @Column({
    name: 'unit_id',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  unitIdentifier: number;

  @Column({ name: 'userid' })
  userid: string;

  @Column({ name: 'add_date' })
  addDate: string;

  @Column({ name: 'update_date' })
  updateDate: string;
}
