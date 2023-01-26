import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';
import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { CheckCatalogResult } from './check-catalog-result.entity';

@Entity({ name: 'camdecmpsmd.check_catalog' })
export class CheckCatalog extends BaseEntity {
  @PrimaryColumn({
    name: 'check_catalog_id',
    transformer: new NumericColumnTransformer(),
  })
  checkCatalogId: number;

  @Column({ name: 'check_type_cd' })
  checkTypeCode: string;

  @Column({ name: 'check_number', transformer: new NumericColumnTransformer() })
  checkNumber: number;

  @Column({ name: 'check_name' })
  checkName: string;

  @Column({ name: 'check_description' })
  checkDescription: string;

  @Column({ name: 'check_prodcedure' })
  checkProcedure: string;

  @Column({ name: 'old_check_name' })
  oldCheckName: string;

  @Column({ name: 'tech_note' })
  techNote: string;

  @Column({ name: 'todo_note' })
  todoNote: string;

  @Column({ name: 'check_applicability_cd' })
  checkApplicabilityCode: string;

  @Column({ name: 'check_status_cd' })
  checkStatusCode: string;

  @Column({ name: 'test_status_cd' })
  testStatusCode: string;

  @Column({ name: 'code_status_cd' })
  codeStatusCode: string;

  @Column({ name: 'run_check_flg' })
  runCheckFlag: string;

  @OneToMany(() => CheckCatalogResult, (ccr) => ccr.checkCatalog)
  checkCatalogResult: CheckCatalog[];
}
