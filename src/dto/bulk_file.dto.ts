export class BulkFileDTO {
  id: number;
  filename: string;
  bytes: number;
  kiloBytes: number;
  megaBytes: number;
  gigaBytes: number;
  lastUpdated: Date;
  metadata: object;
}
