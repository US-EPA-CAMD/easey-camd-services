import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpsaux.import_set' })
export class ImportSet extends BaseEntity {
  @PrimaryColumn({ name: 'import_set_id' })
  importSetId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'user_email' })
  userEmail: string;

  @Column({ name: 'add_time' })
  addTime: Date;

  @Column({ name: 'queued_time' })
  queuedTime?: Date;

  @Column({ name: 'started_time' })
  startedTime?: Date;

  @Column({ name: 'completed_time' })
  completedTime?: Date;

  @Column({ name: 'note' })
  note?: string;

  @Column({ name: 'note_time' })
  noteTime?: Date;

  // Generated column - read-only.
  @Column({ name: 'status_cd', insert: false, update: false })
  statusCode: string;
}
