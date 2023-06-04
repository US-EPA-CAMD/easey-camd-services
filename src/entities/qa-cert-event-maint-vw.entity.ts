import { BaseEntity, ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'camdecmps.vw_qa_cert_event_maintenance' })
export class QaCertEventMaintView extends BaseEntity {
    @ViewColumn({
        name: 'cert_event_id',
    })
    certEventId: string;

    @ViewColumn({
        name: 'location_id',
    })
    locationId: string;

    @ViewColumn({
        name: 'unit_stack',
    })
    unitStack: string;

    @ViewColumn({
        name: 'system_identifier',
    })
    systemIdentifier: string;

    @ViewColumn({
        name: 'component_identifier',
    })
    componentIdentifier: string;

    @ViewColumn({
        name: 'cert_event_cd',
    })
    certEventCode: string;

    @ViewColumn({
        name: 'cert_event_description',
    })
    certEventDescription: string;

    @ViewColumn({
        name: 'event_date_time',
    })
    eventDateTime: string;

    @ViewColumn({
        name: 'required_test_cd',
    })
    requiredTestCode: string;

    @ViewColumn({
        name: 'required_test_description',
    })
    requiredTestDescription: string;

    @ViewColumn({
        name: 'conditional_date_time',
    })
    conditionalDateTime: string;

    @ViewColumn({
        name: 'last_completed_date_time',
    })
    lastCompletedDateTime: string;

    @ViewColumn({
        name: 'submission_availability_cd',
    })
    submissionAvailabilityCode: string;

    @ViewColumn({
        name: 'submission_availability_description',
    })
    submissionAvailabilityDescription: string;

    @ViewColumn({
        name: 'severity_cd',
    })
    severityCode: string;
    @ViewColumn({
        name: 'severity_description',
    })
    severityDescription: string;

}
