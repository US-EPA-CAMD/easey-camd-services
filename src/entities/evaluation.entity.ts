import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';

@Entity({ name: 'camdecmpsaux.evaluation_queue' })
export class Evaluation extends BaseEntity {
  @PrimaryColumn({ name: 'evaluation_id' })
  evaluationIdentifier?: number;

  @Column({ name: 'evaluation_set_id' })
  evaluationSetIdentifier: string;

  @Column({ name: 'process_cd' })
  processCode: string;

  @Column({ name: 'test_sum_id' })
  testSumIdentifier?: string;

  @Column({ name: 'qa_cert_event_id' })
  qaCertEventIdentifier?: string;

  @Column({ name: 'test_extension_exemption_id' })
  testExtensionExemptionIdentifier?: string;

  @Column({
    name: 'rpt_period_id',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  rptPeriodIdentifier?: number;

  @Column({ name: 'submitted_on' })
  submittedOn: Date;

  @Column({ name: 'status_cd' })
  statusCode: string;
}
