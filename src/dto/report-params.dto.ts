import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ReportCodes } from '../enums/report-codes.enum';

export class ReportParamsDTO {
  @ApiProperty({
    enum: ReportCodes,
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  reportCode: string;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  facilityId?: number;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  monitorPlanId?: string;

  @ApiProperty({
    isArray: true,
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  @Transform(({ value }) => value.split('|').map((item: string) => item.trim()))
  testId?: string[];
}
