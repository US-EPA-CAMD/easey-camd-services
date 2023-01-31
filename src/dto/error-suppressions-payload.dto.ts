export class ErrorSuppressionsPayloadDTO {
  checkCatalogResultId: number;
  severityCode: string;
  facilityId: number;
  locations: string;
  matchDataTypeCode: string;
  matchDataValue: string;
  matchTimeTypeCode: string;
  matchTimeBeginValue: Date;
  matchTimeEndValue: Date;
  matchHistoricalIndicator: boolean;
  reasonCode: string;
  note: string;
}
