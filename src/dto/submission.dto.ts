export class IdQuarterPair {
  id: string;
  quarter: string;
}

export class SubmissionItem {
  monPlanId: string;
  submitMonPlan: boolean;
  testSumIds: IdQuarterPair[];
  qceIds: IdQuarterPair[];
  teeIds: IdQuarterPair[];
  emissionsReportingPeriods: string[];
}

export class SubmissionsDTO {
  activityId: string;
  items: SubmissionItem[];
}
