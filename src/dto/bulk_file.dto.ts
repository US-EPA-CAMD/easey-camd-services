export class BulkFileDTO {
  Id: number;
  FileName: string;
  Bytes: number;
  Kilobytes: number;
  Megabytes: number;
  Gigabytes: number;
  LastUpdated: Date;
  Metadata: object;
}
