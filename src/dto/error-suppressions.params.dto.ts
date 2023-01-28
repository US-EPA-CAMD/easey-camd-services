import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional } from 'class-validator';

import { SeverityCodes } from '../enums/severity-codes.enum';
import { ReasonCodes } from '../enums/reason-codes.enum';

export class ErrorSuppressionsParamsDTO {
  @ApiProperty()
  @IsNotEmpty()
  checkTypeCode: string;

  @ApiProperty()
  @IsNotEmpty()
  checkNumber: number;

  @ApiProperty()
  @IsNotEmpty()
  checkResult: string;

  @ApiProperty({ enum: SeverityCodes })
  @IsOptional()
  severityCode?: string;

  @ApiProperty()
  @IsOptional()
  facilityId?: number;

  @ApiProperty()
  @IsOptional()
  esId?: number;

  @ApiProperty({ isArray: true })
  @IsOptional()
  @Transform(({ value }) => value.split('|').map((item) => item.trim()))
  locations?: string[];

  @ApiProperty({ enum: ReasonCodes })
  @IsOptional()
  reasonCode?: string;

  @ApiProperty()
  @IsOptional()
  beginDateHrQtr?: string;

  @ApiProperty()
  @IsOptional()
  endDateHrQtr?: string;

  @ApiProperty()
  @IsOptional()
  active?: boolean;
}
