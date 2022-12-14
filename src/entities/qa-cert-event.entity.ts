import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpswks.qa_cert_event' })
export class QaCertEvent extends BaseEntity {
  @PrimaryColumn({ name: 'qa_cert_event_id' })
  id: string;

  @Column({ name: 'chk_session_id' })
  checkSessionId: string;

  @Column({ name: 'submission_availability_cd' })
  submissionAvailabilityCode: string;
}
