export class BoomarkPayloadDTO {
  dataType: string;
  dataSubType: string;
  filters: any;
  dataPreview: DataPreview;
}

class DataPreview {
  rendered: boolean;
  excludedColumns: string[];
}
