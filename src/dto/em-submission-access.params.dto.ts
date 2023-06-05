import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { Status } from '../enums/status.enum';
import { Type } from 'class-transformer';

export class EmSubmissionAccessParamsDTO {
  @IsOptional()
  @ApiProperty()
  @Type(() => Number)
  facilityId?: number;

  @IsOptional()
  @ApiProperty()
  monitorPlanId?: string;

  @IsOptional()
  @ApiProperty()
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @ApiProperty()
  @Type(() => Number)
  quarter?: number;

  @IsOptional()
  @ApiProperty({ enum: Status })
  status?: string;
}
