import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
    name: 'camdecmpsaux.vw_evaluation_queue_position',
})
export class EvaluationQueuePosition {
    @ViewColumn({
        name: 'evaluation_set_id',
    })
    evaluationSetIdentifier: string;

    @ViewColumn({
        name: 'evaluation_id',
    })
    evaluationIdentifier: string;

    @ViewColumn({
        name: 'mon_plan_id',
    })
    monPlanIdentifier: string;

    @ViewColumn({
        name: 'test_sum_id',
    })
    testSumIdentifier: string;

    @ViewColumn({
        name: 'qa_cert_event_id',
    })
    qaCertEventIdentifier: string;

    @ViewColumn({
        name: 'test_extension_exemption_id',
    })
    testExtensionExemptionIdentifier: string;

    @ViewColumn({
        name: 'period_abbreviation',
    })
    periodAbbreviation: string;

    @ViewColumn({
        name: 'process_cd',
    })
    processCode: string;

    @ViewColumn({
        name: 'queuePosition',
    })
    queuePosition: number;
}
