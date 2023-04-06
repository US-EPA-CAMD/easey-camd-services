import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsString } from 'class-validator';

export class EvaluationItem {
  @ApiProperty()
  @IsString()
  monPlanId: string;

  @ApiProperty()
  @IsBoolean()
  submitMonPlan: boolean;

  @ApiProperty()
  @IsArray()
  testSumIds: string[];

  @ApiProperty()
  @IsArray()
  qceIds: string[];

  @ApiProperty()
  @IsArray()
  teeIds: string[];

  @ApiProperty()
  @IsArray()
  emissionsReportingPeriods: string[];
}

export class EvaluationDTO {
  @ApiProperty()
  items: EvaluationItem[];

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  userEmail: string;
}
