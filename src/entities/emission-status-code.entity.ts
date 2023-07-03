import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpsmd.em_status_code' })
export class EmissionStatusCode extends BaseEntity {
  @PrimaryColumn({
    name: 'em_status_cd',
  })
  EmissionStatusCode: string;

  @Column({
    name: 'em_status_cd_description',
  })
  EmissionStatusDescription: string;
}
