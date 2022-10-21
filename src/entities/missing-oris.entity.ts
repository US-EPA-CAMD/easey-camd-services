import { BaseEntity, Entity, Column, PrimaryColumn } from 'typeorm';
import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';

@Entity({ name: 'camdaux.missing_oris' })
export class MissingOris extends BaseEntity {
  @PrimaryColumn({
    name: 'id',
  })
  id: string;

  @Column({
    name: 'oris_code',
    transformer: new NumericColumnTransformer(),
  })
  orisCode: number;

  @Column({
    name: 'state_cd',
  })
  stateCd: string;
}
