import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'camdecmpsaux.email_attachment' })
export class EmailAttachment extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'email_attachment_id', type: 'bigint' })
  emailAttachmentIdentifier: number;

  @Column({ name: 'to_send_id', type: 'bigint' })
  toSendIdentifier: number;

  @Column({ name: 'email_attachment_name', type: 'text' })
  emailAttachmentName: string;

  @Column({ name: 'email_attachment_content', type: 'text' })
  emailAttachmentContent: string;
}
