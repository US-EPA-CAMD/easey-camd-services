export class BoomarkPayloadDTO {
  dataType: string;
  dataSubType: string;
  filters: any;
  dataPreview: {
    rendered: boolean;
    excludedColumns: string[];
  };
}
