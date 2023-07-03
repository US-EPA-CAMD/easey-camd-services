import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpsaux.email_template' })
export class EmailTemplate extends BaseEntity {
  @PrimaryColumn({ name: 'template_id' })
  templateIdentifier: number;

  @Column({ name: 'template_location' })
  templateLocation: string;

  @Column({ name: 'template_subject' })
  templateSubject: string;
}
