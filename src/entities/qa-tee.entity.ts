import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpswks.test_extension_exemption' })
export class QaTEE extends BaseEntity {
  @PrimaryColumn({ name: 'test_extension_exemption_id' })
  id: string;

  @Column({ name: 'chk_session_id' })
  checkSessionId: string;

  @Column({ name: 'submission_availability_cd' })
  submissionAvailabilityCode: string;
}
