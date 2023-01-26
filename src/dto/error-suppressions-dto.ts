export class ErrorSuppressionsDTO {
  id: number;
  checkCatalogResultId: number;
  checkTypeCode: string;
  checkNumber: number;
  checkResultCode: string;
  severityCode: string;
  facilityId: number;
  orisCode: number;
  locations: string;
  matchDataTypeCode: string;
  matchDataValue: string;
  matchTimeTypeCode: string;
  matchTimeBeginValue: Date;
  matchTimeEndValue: Date;
  matchHistoricalIndicator: Boolean;
  reasonCode: string;
  note: string;
  active: Boolean;
  userId: string;
  addDate: Date;
  updateDate: Date;
}
