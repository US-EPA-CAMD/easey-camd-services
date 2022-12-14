export class SubmissionItem {
  monPlanId: string;
  orisCode: number;
  submitMonPlan: boolean;
  submitEmissions: boolean;
  emissionsReportingPeriod: string;
  testSumIds: string[];
  qceIds: string[];
  teeIds: string[];
}

export class SubmissionsDTO {
  activityId: string;
  items: SubmissionItem[];
}
