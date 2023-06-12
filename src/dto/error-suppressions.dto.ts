import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDataURI,
  IsDate,
  IsNumber,
  IsString,
} from 'class-validator';

export class ErrorSuppressionsDTO {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNumber()
  checkCatalogResultId: number;

  @ApiProperty()
  @IsString()
  checkTypeCode: string;

  @ApiProperty()
  @IsNumber()
  checkNumber: number;

  @ApiProperty()
  @IsString()
  checkResultCode: string;

  @ApiProperty()
  @IsString()
  severityCode: string;

  @ApiProperty()
  @IsNumber()
  facilityId: number;

  @ApiProperty()
  @IsString()
  facilityName: string;

  @ApiProperty()
  @IsNumber()
  orisCode: number;

  @ApiProperty()
  @IsString()
  locations: string;

  @ApiProperty()
  @IsString()
  matchDataTypeCode: string;

  @ApiProperty()
  @IsString()
  matchDataValue: string;

  @ApiProperty()
  @IsString()
  matchTimeTypeCode: string;

  @ApiProperty()
  @IsDate()
  matchTimeBeginValue: Date;

  @ApiProperty()
  @IsDate()
  matchTimeEndValue: Date;

  @ApiProperty()
  @IsBoolean()
  matchHistoricalIndicator: boolean;

  @ApiProperty()
  @IsString()
  reasonCode: string;

  @ApiProperty()
  @IsString()
  note: string;

  @ApiProperty()
  @IsBoolean()
  active: boolean;

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsDate()
  addDate: Date;

  @ApiProperty()
  @IsDate()
  updateDate: Date;
}
