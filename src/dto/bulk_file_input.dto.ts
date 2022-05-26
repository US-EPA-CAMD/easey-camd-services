export class BulkFileInputDTO {
  s3Path: string;
  filename: string;
  bytes: number;
  metadata: object;
}
