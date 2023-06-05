import { BaseEntity, ViewColumn, ViewEntity } from 'typeorm';

import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';

@ViewEntity({ name: 'camdecmps.vw_qa_test_summary_maintenance' })
export class QaTestSummaryMaintView extends BaseEntity {
  @ViewColumn({
    name: 'test_sum_id',
  })
  testSumId: string;

  @ViewColumn({
    name: 'location_id',
  })
  locationId: string;

  @ViewColumn({
    name: 'oris_code',
    transformer: new NumericColumnTransformer(),
  })
  orisCode: number;

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
    name: 'test_number',
  })
  testNumber: string;

  @ViewColumn({
    name: 'grace_period_indicator',
    transformer: new NumericColumnTransformer(),
  })
  gracePeriodIndicator: number;

  @ViewColumn({
    name: 'test_type_cd',
  })
  testTypeCode: string;

  @ViewColumn({
    name: 'test_reason_cd',
  })
  testReasonCode: string;

  @ViewColumn({
    name: 'test_result_cd',
  })
  testResultCode: string;

  @ViewColumn({
    name: 'year_quarter',
  })
  yearQuarter: string;

  @ViewColumn({
    name: 'test_description',
  })
  testDescription: string;

  @ViewColumn({
    name: 'begin_date_time',
  })
  beginDateTime: string;

  @ViewColumn({
    name: 'end_date_time',
  })
  endDateTime: string;
  @ViewColumn({
    name: 'test_comment',
  })
  testComment: string;
  @ViewColumn({
    name: 'span_scale_cd',
  })
  spanScaleCode: string;
  @ViewColumn({
    name: 'injection_protocol_cd',
  })
  injectionProtocolCode: string;
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
