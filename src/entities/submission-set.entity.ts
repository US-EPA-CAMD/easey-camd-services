import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'camdecmpsaux.submission_set' })
export class SubmissionSet extends BaseEntity {
  @PrimaryColumn({ name: 'submission_set_id' })
  id: number;

  @Column({ name: 'activity_id' })
  activityId: string;

  @Column({ name: 'fac_id' })
  facId: number;

  @Column({ name: 'mon_plan_id' })
  monPlanId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'add_date' })
  addDate: Date;
}
