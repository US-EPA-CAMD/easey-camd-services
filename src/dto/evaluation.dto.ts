import { ApiProperty } from '@nestjs/swagger';

export class EvaluationItem {
  @ApiProperty()
  monPlanId: string;

  @ApiProperty()
  submitMonPlan: boolean;

  @ApiProperty()
  testSumIds: string[];

  @ApiProperty()
  qceIds: string[];

  @ApiProperty()
  teeIds: string[];

  @ApiProperty()
  emissionsReportingPeriods: string[];
}

export class EvaluationDTO {
  @ApiProperty()
  items: EvaluationItem[];

  @ApiProperty()
  userId: string;

  @ApiProperty()
  userEmail: string;
}
