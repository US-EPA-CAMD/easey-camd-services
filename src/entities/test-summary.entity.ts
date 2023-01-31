import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpswks.test_summary' })
export class TestSummary extends BaseEntity {
  @PrimaryColumn({ name: 'test_sum_id' })
  id: string;

  @Column({ name: 'chk_session_id' })
  checkSessionId: string;
}
