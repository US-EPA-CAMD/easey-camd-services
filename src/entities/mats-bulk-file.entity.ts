import { NumericColumnTransformer } from "@us-epa-camd/easey-common/transforms";
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'camdecmpswks.mats_bulk_file' })
export class MatsBulkFile extends BaseEntity {
    @PrimaryGeneratedColumn({
        name: 'mats_bulk_file_id'
    })
    id: number;

    @Column({
        name: 'fac_id',
        type: 'numeric',
        transformer: new NumericColumnTransformer(),
        nullable: false,
    })
    facIdentifier: number;

    @Column({
        name: 'oris_code',
        type: 'numeric',
        transformer: new NumericColumnTransformer(),
        nullable: false,
    })
    orisCode: number;

    @Column({ name: 'facility_name', nullable: false, })
    facilityName: string;

    @Column({ name: 'mon_plan_id', nullable: false, })
    monPlanIdentifier: string;

    @Column({ name: 'test_num', nullable: false, })
    testNumber: string;

    @Column({ name: 'filename', nullable: false, })
    fileName: string;

    @Column({ name: 'last_updated' })
    lastUpdated: Date;

    @Column({ name: 'updated_status_flg' })
    updatedStatusFlag: string;

    @Column({
        name: 'submission_id',
        type: 'numeric',
        transformer: new NumericColumnTransformer(),
    })
    submissionId: number;

    @Column({ name: 'submission_availability_cd' })
    submissionAvailabilityCode: string;

    @Column({ name: 'userid' })
    userId: string;

    @Column({ name: 'add_date' })
    addDate: Date;
}