import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsString } from 'class-validator';

export class EmSubmissionAccessDTO {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNumber()
  facilityId: number;

  @ApiProperty()
  @IsNumber()
  orisCode: number;

  @ApiProperty()
  @IsString()
  monitorPlanId: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsString()
  locations: string;

  @ApiProperty()
  @IsNumber()
  reportingPeriodId: number;

  @ApiProperty()
  @IsString()
  reportingFrequencyCode: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsDate()
  openDate: Date;

  @ApiProperty()
  @IsDate()
  closeDate: Date;

  @ApiProperty()
  @IsString()
  emissionStatusCode: string;

  @ApiProperty()
  @IsString()
  submissionAvailabilityCode: string;

  @ApiProperty()
  @IsNumber()
  lastSubmissionId: number;

  @ApiProperty()
  @IsString()
  submissionTypeCode: string;

  @ApiProperty()
  @IsString()
  severityLevel: string;

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsDate()
  addDate: Date;

  @ApiProperty()
  @IsDate()
  updateDate: Date;
}
