import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';

@Entity({ name: 'camdecmpswks.qa_cert_event' })
export class QaCertEvent extends BaseEntity {
  @PrimaryColumn({ name: 'qa_cert_event_id' })
  qaCertEventIdentifier: string;

  @Column({ name: 'eval_status_cd' })
  evalStatusCode: string;
}
