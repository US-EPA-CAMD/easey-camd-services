import {
  IsBoolean,
  IsDate,
  IsDateString,
  IsNumber,
  IsString,
} from 'class-validator';

export class ErrorSuppressionsPayloadDTO {
  @IsNumber()
  checkCatalogResultId: number;
  @IsString()
  severityCode: string;
  @IsNumber()
  facilityId: number;
  @IsString()
  locations: string;
  @IsString()
  matchDataTypeCode: string;
  @IsString()
  matchDataValue: string;
  @IsString()
  matchTimeTypeCode: string;
  @IsDateString()
  matchTimeBeginValue: Date;
  @IsDateString()
  matchTimeEndValue: Date;
  @IsBoolean()
  matchHistoricalIndicator: boolean;
  @IsString()
  reasonCode: string;
  @IsString()
  note: string;
}
