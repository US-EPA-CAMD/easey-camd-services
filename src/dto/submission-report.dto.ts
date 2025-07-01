import { ApiProperty } from '@nestjs/swagger';
import {
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
  identifyingInformation: string;

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
  @IsString()
  submissionDateTime: string;

  @ApiProperty()
  @IsString()
  severityLevel: string; 

  @ApiProperty()
  @IsString()
  mostRecent: string;

  @ApiProperty()
  @IsString()
  submissionStatus: string;

  @ApiProperty()
  @IsString()
  severityCode: string;

  @ApiProperty()
  @IsString()
  submitter: string;
}
