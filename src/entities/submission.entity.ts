import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpsaux.submission' })
export class Submission extends BaseEntity {
  @PrimaryColumn({ name: 'submission_id' })
  id: number;

  @Column({ name: 'submission_set_id' })
  submissionSetId: number;

  @Column({ name: 'submission_type_cd' })
  submissionTypeCode: string;

  @Column({ name: 'submission_status_cd' })
  submissionStatusCode: string;

  @Column({ name: 'fac_id' })
  facId: number;

  @Column({ name: 'mon_plan_id' })
  monPlanId: string;

  @Column({ name: 'rpt_period_id' })
  rptPeriodId: number;

  @Column({ name: 'test_sum_id' })
  testSumId: string;

  @Column({ name: 'qa_cert_event_id' })
  qaCertEventId: string;

  @Column({ name: 'test_extension_exemption_id' })
  testExtensionExemptionId: string;

  @Column({ name: 'severity_cd' })
  severityCode: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'add_date' })
  addDate: Date;

  @Column({ name: 'update_date' })
  updateDate: Date;
}
