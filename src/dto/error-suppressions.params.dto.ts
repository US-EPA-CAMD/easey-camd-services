import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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

  @ApiProperty()
  @IsOptional()
  esId?: number;

  @ApiProperty({ isArray: true })
  @IsOptional()
  @ApiProperty({ isArray: true })
  @Transform(({ value }) => value.split('|').map((item) => item.trim()))
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
