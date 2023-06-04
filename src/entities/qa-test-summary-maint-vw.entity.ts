import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';

@Entity({ name: 'camdecmps.vw_qa_test_summary_maintenance' })
export class QaTestSummaryMaintView extends BaseEntity {
    @Column({
        name: 'rpt_period_id',
        type: 'string',
    })
    testSumId: string;

    @Column({
        name: 'location_id',
        type: 'varchar'
    })
    locationId: string;

    @Column({
        name: 'unit_stack',
        type: 'varchar'
    })
    unitStack: string;

    @Column({
        name: 'system_identifier',
        type: 'varchar'
    })
    systemIdentifier: string;

    @Column({
        name: 'component_identifier',
        type: 'varchar'
    })
    componentIdentifier: string;

    @Column({
        name: 'test_number',
        type: 'varchar'
    })
    testNumber: string;

    @Column({
        name: 'grace_period_indicator',
        type: 'numeric',
        transformer: new NumericColumnTransformer(),
    })
    gracePeriodIndicator: number;

    @Column({
        name: 'test_type_cd',
        type: 'varchar'
    })
    testTypeCode: string;

    @Column({
        name: 'test reason_cd',
        type: 'varchar'
    })
    testReasonCode: string;

    @Column({
        name: 'test_result_cd',
        type: 'varchar'
    })
    testResultCode: string;

    @Column({
        name: 'year_quarter',
        type: 'varchar'
    })
    yearQuarter: string;

    @Column({
        name: 'test_description',
        type: 'varchar'
    })
    testDescription: string;

    @Column({
        name: 'begin_date_time',
        type: 'varchar'
    })
    beginDateTime: string;

    @Column({
        name: 'end_date_time',
        type: 'varchar'
    })
    endDateTime: string;
    @Column({
        name: 'test_comment',
        type: 'varchar'
    })
    testComment: string;
    @Column({
        name: 'span_scale_cd',
        type: 'varchar'
    })
    spanScaleCode: string;
    @Column({
        name: 'injection_protocol_cd',
        type: 'varchar'
    })
    injectionProtocolCode: string;
    @Column({
        name: 'submission_availability_cd',
        type: 'varchar'
    })
    submissionAvailabilityCode: string;
    @Column({
        name: 'submission_availability_description',
        type: 'varchar'
    })
    submissionAvailabilityDescription: string;
    @Column({
        name: 'severity_cd',
        type: 'varchar'
    })
    severityCode: string;
    @Column({
        name: 'severity_description',
        type: 'varchar'
    })
    severityDescription: string;

}
