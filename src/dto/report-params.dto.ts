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
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  testId?: string;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  batchView?: boolean;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  workspace?: boolean;
}
