import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';

@Entity({ name: 'camdmd.state_code' })
export class StateCode extends BaseEntity {
  @PrimaryColumn({ name: 'state_cd' })
  stateCode: string;

  @Column({ name: 'state_name' })
  stateName: string;

  @Column({
    name: 'domestic_ind',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  domesticIndicator: number;

  @Column({
    name: 'indian_country_ind',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  indianCountryIndicator: number;

  @Column({
    name: 'epa_region',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  epaRegion: number;
}
