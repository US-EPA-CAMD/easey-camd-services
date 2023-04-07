import { ApiProperty } from '@nestjs/swagger';
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys,
} from '@us-epa-camd/easey-common/data-dictionary';

export class IdQuarterPair {
  @ApiProperty()
  id: string;

  @ApiProperty(
    DataDictionary.getMetadata(PropertyKeys.QUARTER, OverrideKeys.SUBMISSION),
  )
  quarter: string;
}

export class SubmissionItem {
  @ApiProperty()
  monPlanId: string;

  @ApiProperty()
  submitMonPlan: boolean;

  @ApiProperty()
  testSumIds: IdQuarterPair[];

  @ApiProperty()
  qceIds: IdQuarterPair[];

  @ApiProperty()
  teeIds: IdQuarterPair[];

  @ApiProperty()
  emissionsReportingPeriods: string[];
}

export class SubmissionsDTO {
  @ApiProperty(
    DataDictionary.getMetadata(PropertyKeys.ID, OverrideKeys.SUBMISSION),
  )
  activityId: string;

  @ApiProperty()
  items: SubmissionItem[];
}
