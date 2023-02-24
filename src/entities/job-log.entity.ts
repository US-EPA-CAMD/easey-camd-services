import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdaux.bulk_file_queue' })
export class JobLog extends BaseEntity {
  @PrimaryColumn({ name: 'job_id' })
  jobIdentifier: string;

  @Column({ name: 'parent_job_id' })
  parentJobIdentifier: string;

  @Column({ name: 'job_name' })
  jobName: string;

  @Column({ name: 'start_date' })
  startDate: string;

  @Column({ name: 'end_date' })
  endDate: string;

  @Column({ name: 'year' })
  year: number;

  @Column({ name: 'quarter' })
  quarter: number;

  @Column({ name: 'state_cd' })
  stateCode: string;

  @Column({ name: 'data_type' })
  dataType: string;

  @Column({ name: 'sub_type' })
  subType: string;

  @Column({ name: 'url' })
  url: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'program_cd' })
  programCode: string;

  @Column({ name: 'additional_details' })
  additionalDetails: string;

  @Column({ name: 'add_date' })
  addDate: string;

  @Column({ name: 'status_cd' })
  statusCode: string;
}
