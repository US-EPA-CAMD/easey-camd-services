import { BaseEntity, ViewColumn, ViewEntity } from 'typeorm';

import { NumericColumnTransformer } from '@us-epa-camd/easey-common/transforms';

@ViewEntity({ name: 'camdecmps.vw_qa_test_extens_exempt_maintenance' })
export class QaTeeMaintView extends BaseEntity {
  @ViewColumn({
    name: 'test_extension_exemption_id',
  })
  testExtensionExemptionId: string;

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
    name: 'fuel_cd',
  })
  fuelCode: string;

  @ViewColumn({
    name: 'fuel_description',
  })
  fuelDescription: string;

  @ViewColumn({
    name: 'extension_exemption_cd',
  })
  extensionExemptionCode: string;

  @ViewColumn({
    name: 'extension_exemption_description',
  })
  extensionExemptionDescription: string;

  @ViewColumn({
    name: 'hours_used',
    transformer: new NumericColumnTransformer(),
  })
  hoursUsed: string;

  @ViewColumn({
    name: 'span_scale_cd',
  })
  spanScaleCode: string;

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
