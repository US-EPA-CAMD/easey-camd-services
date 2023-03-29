import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdmd.county_code' })
export class CountyCode extends BaseEntity {
  @PrimaryColumn({ name: 'county_cd' })
  countyCode: string;

  @Column({ name: 'county_number' })
  countyNumber: string;

  @Column({ name: 'county_name' })
  countyName: string;

  @Column({ name: 'state_cd' })
  stateCode: string;
}
