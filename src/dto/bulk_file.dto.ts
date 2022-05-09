export class BulkFileDTO {
  id: number;
  s3Path: string;
  filename: string;
  bytes: number;
  kiloBytes: number;
  megaBytes: number;
  gigaBytes: number;
  lastUpdated: Date;
  metadata: object;
}
