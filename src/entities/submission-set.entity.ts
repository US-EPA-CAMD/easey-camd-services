import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';

@Entity({ name: 'camdecmpsaux.submission_set' })
export class SubmissionSet extends BaseEntity {
  @PrimaryColumn({ name: 'submission_set_id' })
  submissionSetIdentifier: string;

  @Column({ name: 'mon_plan_id' })
  monPlanIdentifier: string;

  @Column({ name: 'submitted_on' })
  submittedOn: Date;

  @Column({ name: 'user_id' })
  userIdentifier: string;

  @Column({ name: 'user_email' })
  userEmail: string;

  @Column({
    name: 'fac_id',
    type: 'numeric',
    transformer: new NumericColumnTransformer(),
  })
  facIdentifier: number;

  @Column({ name: 'fac_name' })
  facName: string;

  @Column({ name: 'configuration' })
  configuration: string;
}
