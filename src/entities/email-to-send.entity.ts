import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpsaux.email_to_send' })
export class EmailToSend extends BaseEntity {
  @PrimaryColumn({ name: 'to_send_id' })
  toSendIdentifier: number;

  @Column({ name: 'to_email' })
  toEmail: string;

  @Column({ name: 'from_email' })
  fromEmail: string;

  @Column({ name: 'template_id' })
  templateIdentifier: number;

  @Column({ name: 'context' })
  context: string;

  @Column({ name: 'status_cd' })
  statusCode: string;
}
