import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class EmSubmissionAccessPayloadDTO {
  @ApiProperty()
  @IsString()
  monitorPlanId: string;

  @ApiProperty()
  @IsNumber()
  reportingPeriodId: number;

  @ApiProperty()
  openDate: Date;

  @ApiProperty()
  closeDate: Date;

  @ApiProperty()
  @IsString()
  submissionTypeCode: string;

  @ApiProperty()
  @IsString()
  resubExplanation: string;

  @ApiProperty()
  @IsString()
  emissionStatusCode: string;

  @ApiProperty()
  @IsString()
  submissionAvailabilityCode: string;
}
