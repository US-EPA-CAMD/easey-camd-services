import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdaux.sftp_log' })
export class SftpLog extends BaseEntity {
  @PrimaryColumn({ name: 'id' })
  id: string;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ name: 'end_date' })
  endDate: Date;

  @Column({ name: 'status_cd' })
  statusCd: string;

  @Column({ name: 'details' })
  details: string;

  @Column({ name: 'errors' })
  errors: string;
}
