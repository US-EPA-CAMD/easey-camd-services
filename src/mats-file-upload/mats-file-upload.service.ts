import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';

@Injectable()
export class MatsFileUploadService {
  private s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {}

  async uploadFile(fileName: string, file: Buffer) {
    if (
      !this.configService.get<string>('matsConfig.awsRegion') ||
      !this.configService.get<string>('matsConfig.matsImportBucket') ||
      !this.configService.get<string>('matsConfig.matsImportBucketAccessKey') ||
      !this.configService.get<string>('matsConfig.matsImportBucketSecretAccessKey')
    ) {
      throw new EaseyException(
        new Error('No AWS credentials'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const matsConfig = this.configService.get("matsConfig");

    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: matsConfig.matsImportBucketAccessKey,
        secretAccessKey: matsConfig.matsImportBucketSecretAccessKey,
      },
      region: matsConfig.awsRegion,
    });

    return this.s3Client.send(
      new PutObjectCommand({
        Body: file,
        Key: fileName,
        Bucket: matsConfig.matsImportBucket,
      }),
    );
  }
}
