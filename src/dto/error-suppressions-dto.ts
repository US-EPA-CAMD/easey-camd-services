import { ApiProperty } from '@nestjs/swagger';

export class ErrorSuppressionsDTO {
  @ApiProperty()
  id: number;

  @ApiProperty()
  checkCatalogResultId: number;

  @ApiProperty()
  checkTypeCode: string;

  @ApiProperty()
  checkNumber: number;

  @ApiProperty()
  checkResultCode: string;

  @ApiProperty()
  severityCode: string;

  @ApiProperty()
  facilityId: number;

  @ApiProperty()
  orisCode: number;

  @ApiProperty()
  locations: string;

  @ApiProperty()
  matchDataTypeCode: string;

  @ApiProperty()
  matchDataValue: string;

  @ApiProperty()
  matchTimeTypeCode: string;

  @ApiProperty()
  matchTimeBeginValue: Date;

  @ApiProperty()
  matchTimeEndValue: Date;

  @ApiProperty()
  matchHistoricalIndicator: boolean;

  @ApiProperty()
  reasonCode: string;

  @ApiProperty()
  note: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  addDate: Date;

  @ApiProperty()
  updateDate: Date;
}
