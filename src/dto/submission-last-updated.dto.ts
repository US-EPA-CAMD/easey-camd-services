import { ValidationArguments } from 'class-validator';
import { IsValidDateFormat } from '../pipes/is-valid-date-format.pipe';

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

export class SubmissionsLastUpdatedQueryDTO {
  @IsValidDateFormat({
      message: (args: ValidationArguments) => {
        return `Ensure ${args.property} is a valid date format of YYYY-MM-DD.`;
      },
    })
  date: Date;
}
