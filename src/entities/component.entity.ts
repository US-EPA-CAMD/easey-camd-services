import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';

@Entity({ name: 'camdecmpswks.component' })
export class Component extends BaseEntity {
  @PrimaryColumn({ name: 'component_id' })
  componentId: string;

  @Column({ name: 'mon_loc_id' })
  monLOCIdentifier: string;

  @Column({ name: 'component_identifier' })
  componentIdentifier: string;

  @Column({ name: 'model_version' })
  modelVersion: string;

  @Column({ name: 'serial_number' })
  serialNumber: string;

  @Column({ name: 'manufacturer' })
  manufacturer: string;

  @Column({ name: 'component_type_cd' })
  componentTypeCode: string;

  @Column({ name: 'acq_cd' })
  acqCode: string;

  @Column({ name: 'basis_cd' })
  basisCode: string;

  @Column({ name: 'userid' })
  userid: string;

  @Column({ name: 'add_date' })
  addDate: string;

  @Column({ name: 'update_date' })
  updateDate: string;

  @Column({
    name: 'hg_converter_ind',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  hgConverterIndicator: number;
}
