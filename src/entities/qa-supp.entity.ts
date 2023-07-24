import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpswks.qa_supp_data' })
export class QaSuppData extends BaseEntity {
  @PrimaryColumn({ name: 'qa_supp_data_id' })
  id: string;

  @Column({ name: 'test_sum_id' })
  testSumId: string;

  @Column({ name: 'submission_availability_cd' })
  submissionAvailabilityCode: string;

  @Column({ name: 'resub_explanation' })
  resubExplanation: string;
}
