import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNumber,
  IsString,
} from 'class-validator';

export class SubmissionReportDTO {
  @ApiProperty()
  @IsNumber()
  orisCode: number;

  @ApiProperty()
  @IsString()
  facilityName: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsString()
  locations: string;

  @ApiProperty()
  @IsString()
  reportingPeriodAbbreviation: string;

  @ApiProperty()
  @IsString()
  reportingFrequencyCode: string;

  @ApiProperty()
  @IsString()
  submissionTypeCode: string;

  @ApiProperty()
  @IsNumber()
  submissionId: number;

  @ApiProperty()
  @IsDate()
  submissionDateTime: Date;

  @ApiProperty()
  @IsString()
  severityLevel: string; 

  @ApiProperty()
  @IsString()
  mostRecet: string;

  @ApiProperty()
  @IsString()
  submissionCode: string;

  @ApiProperty()
  @IsString()
  severityCode: string;

  @ApiProperty()
  @IsString()
  criticalErrLevelOne: string;

  @ApiProperty()
  @IsString()
  criticalErrLevelTwo: string;

  @ApiProperty()
  @IsString()
  nonCritical: string;

  @ApiProperty()
  @IsString()
  infoMessage: string;

  @ApiProperty()
  @IsString()
  adminOverride: string;

  @ApiProperty()
  @IsString()
  submitter: string;
}
