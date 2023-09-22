export class SubmissionsLastUpdatedDTO {
  id: number;
  fileTypeCode: string;
  severityCode: string;
  facId: number;
  monitorPlanId: string;
  reportPeriodId: number;
  submissionEndStateStageTime: Date;
  submissionSetId: string;
  lastUpdated: Date;
  userId: string;
}

export class EmissionsLastUpdatedDTO {
  monitorPlanId: string;
  reportPeriodId: number;
  submissionId: number;
  lastUpdated: string;
}

export class SubmissionsLastUpdatedResponseDTO {
  submissionLogs: SubmissionsLastUpdatedDTO[];
  emissionReports: EmissionsLastUpdatedDTO[];
  mostRecentUpdateDate: Date;
}
