import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

import { SeverityCodes } from '../enums/severity-codes.enum';
import { ReasonCodes } from '../enums/reason-codes.enum';

export class ErrorSuppressionsParamsDTO {
  @IsNotEmpty()
  @ApiProperty()
  checkTypeCode: string;

  @IsNotEmpty()
  @ApiProperty()
  checkNumber: number;

  @IsNotEmpty()
  @ApiProperty()
  checkResult: string;

  @IsOptional()
  @ApiProperty({ enum: SeverityCodes })
  severityCode?: string;

  @IsOptional()
  @ApiProperty()
  facilityId?: number;

  @IsOptional()
  @ApiProperty({ isArray: true })
  locations?: string[];

  @IsOptional()
  @ApiProperty({ enum: ReasonCodes })
  reasonCode?: string;

  @IsOptional()
  @ApiProperty()
  beginDateHrQtr?: string;

  @IsOptional()
  @ApiProperty()
  endDateHrQtr?: string;

  @IsOptional()
  @ApiProperty()
  active?: boolean;
}
