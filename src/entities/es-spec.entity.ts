import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CheckCatalogResult } from './check-catalog-result.entity';
import { Plant } from './plant.entity';

@Entity({ name: 'camdecmpsaux.es_spec' })
export class EsSpec extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'es_spec_id',
  })
  id: number;

  @Column({
    name: 'check_catalog_result_id',
    transformer: new NumericColumnTransformer(),
  })
  checkCatalogResultId: number;

  @Column({ name: 'severity_cd' })
  severityCode: string;

  @Column({ name: 'fac_id', transformer: new NumericColumnTransformer() })
  facilityId: number;

  @Column({ name: 'location_name_list' })
  locations: string;

  @Column({ name: 'es_match_data_type_cd' })
  matchDataTypeCode: string;

  @Column({ name: 'match_data_value' })
  matchDataValue: string;

  @Column({ name: 'es_match_time_type_cd' })
  matchTimeTypeCode: string;

  @Column({
    name: 'match_historical_ind',
    transformer: new NumericColumnTransformer(),
  })
  matchHistoricalIndicator: number;

  @Column({ name: 'match_time_begin_value' })
  matchTimeBeginValue: Date;

  @Column({ name: 'match_time_end_value' })
  matchTimeEndValue: Date;

  @Column({ name: 'di' })
  di: string;

  @Column({ name: 'es_reason_cd' })
  reasonCode: string;

  @Column({ name: 'note' })
  note: string;

  @Column({ name: 'active_ind', transformer: new NumericColumnTransformer() })
  active: number;

  @Column({ name: 'userid' })
  userId: string;

  @Column({ name: 'add_date' })
  addDate: Date;

  @Column({ name: 'update_date' })
  updateDate: Date;

  @ManyToOne(() => CheckCatalogResult, (ccr) => ccr.esSpec)
  @JoinColumn([
    {
      name: 'check_catalog_result_id',
      referencedColumnName: 'checkCatalogResultId',
    },
  ])
  checkCatalogResult: CheckCatalogResult;

  @ManyToOne(() => Plant, (p) => p.esSpec)
  @JoinColumn([
    {
      name: 'fac_id',
    },
  ])
  plant: Plant;
}
