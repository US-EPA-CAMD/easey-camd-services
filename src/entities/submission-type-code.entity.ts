import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpsmd.em_sub_type_code' })
export class SubmissionTypeCode extends BaseEntity {
  @PrimaryColumn({
    name: 'em_sub_type_cd',
  })
  submissionTypeCode: string;

  @Column({
    name: 'em_sub_type_cd_description',
  })
  submissionTypeDescription: string;
}
