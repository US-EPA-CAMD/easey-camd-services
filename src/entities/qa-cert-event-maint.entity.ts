import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

// @Entity({name:'camdecmps.vw_qa_cert_event_maintenance'})
export class QaCertEventMaintenanceView extends BaseEntity{

}