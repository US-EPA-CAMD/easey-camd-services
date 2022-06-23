export class BulkFileDTO {
  filename: string;
  s3Path: string;
  bytes: number;
  kiloBytes: number;
  megaBytes: number;
  gigaBytes: number;
  lastUpdated: Date;
  metadata: object;
}
