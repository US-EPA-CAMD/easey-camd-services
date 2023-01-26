import { BaseEntity, Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';
import { EsSpec } from './es-spec.entity';

@Entity({ name: 'camd.plant' })
export class Plant extends BaseEntity {
  @PrimaryColumn({
    name: 'fac_id',
    transformer: new NumericColumnTransformer(),
  })
  id: number;

  @Column({
    name: 'oris_code',
    transformer: new NumericColumnTransformer(),
  })
  orisCode: number;

  @Column({
    name: 'state',
  })
  stateCode: string;

  @OneToMany(() => EsSpec, (es) => es.plant)
  esSpec: EsSpec[];
}
