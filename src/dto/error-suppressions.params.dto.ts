import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Allow,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  isNumber,
} from 'class-validator';

import { SeverityCodes } from '../enums/severity-codes.enum';
import { ReasonCodes } from '../enums/reason-codes.enum';

export class ErrorSuppressionsParamsDTO {
  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  checkTypeCode: string;

  @ApiProperty()
  @Allow()
  checkNumber: number;

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  checkResult: string;

  @IsOptional()
  @ApiProperty({ enum: SeverityCodes })
  @IsString()
  severityCode?: string;

  @IsOptional()
  @ApiProperty()
  @IsNumber()
  facilityId?: number;

  @IsOptional()
  @ApiProperty({ isArray: true })
  @Transform(({ value }) => value.split('|').map((item) => item.trim()))
  @IsString()
  locations?: string[];

  @IsOptional()
  @ApiProperty({ enum: ReasonCodes })
  @IsString()
  reasonCode?: string;

  @IsOptional()
  @ApiProperty()
  @IsString()
  beginDateHrQtr?: string;

  @IsOptional()
  @ApiProperty()
  @IsString()
  endDateHrQtr?: string;

  @IsOptional()
  @ApiProperty()
  @IsBoolean()
  active?: boolean;
}
