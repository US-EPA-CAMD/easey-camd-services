export class BulkFileInputDTO {
  filename: string;
  s3Path: string;
  bytes: number;
  metadata: object;
}
