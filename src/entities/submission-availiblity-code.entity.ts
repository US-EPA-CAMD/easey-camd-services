import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpsmd.submission_availability_code' })
export class SubmissionAvailiblityCode extends BaseEntity {
  @PrimaryColumn({
    name: 'submission_availability_cd',
  })
  submissionAvailiblityCode: string;

  @Column({
    name: 'sub_avail_cd_description',
  })
  submissionAvailiblityDescription: string;
}
