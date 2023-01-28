import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { CheckCatalog } from './check-catalog.entity';
import { EsSpec } from './es-spec.entity';

@Entity({ name: 'camdecmpsmd.check_catalog_result' })
export class CheckCatalogResult extends BaseEntity {
  @PrimaryColumn({
    name: 'check_catalog_result_id',
    transformer: new NumericColumnTransformer(),
  })
  checkCatalogResultId: number;

  @Column({
    name: 'check_catalog_id',
    transformer: new NumericColumnTransformer(),
  })
  checkCatalogId: number;

  @Column({ name: 'check_result' })
  checkResult: string;

  @Column({ name: 'severity_cd' })
  severityCode: string;

  @Column({
    name: 'response_catalog_id',
    transformer: new NumericColumnTransformer(),
  })
  responseCatalogId: number;

  @Column({
    name: 'es_allowed_ind',
    transformer: new NumericColumnTransformer(),
  })
  esAllowedInd: number;

  @OneToMany(() => EsSpec, (es) => es.checkCatalogResult)
  esSpec: EsSpec[];

  @ManyToOne(() => CheckCatalog, (cc) => cc.checkCatalogResult)
  @JoinColumn([
    {
      name: 'check_catalog_id',
      referencedColumnName: 'checkCatalogId',
    },
  ])
  checkCatalog: CheckCatalog;
}
