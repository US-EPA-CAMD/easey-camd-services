import { BaseEntity, Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdaux.sftp_failures' })
export class SftpFailure extends BaseEntity {
  @PrimaryColumn({
    name: 'id',
  })
  id: string;

  @Column({
    name: 'file_description',
  })
  fileDescription: string;
}
