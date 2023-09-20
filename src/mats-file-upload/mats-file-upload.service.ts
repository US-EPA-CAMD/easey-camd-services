import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { MatsBulkFile } from '../entities/mats-bulk-file.entity';
import { TestTypeCode } from '../entities/test-type-code.entity';

@Injectable()
export class MatsFileUploadService {
  private s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {}

  async uploadFile(file: Buffer, bucketLocation: string) {
    this.s3Client = new S3Client({
      credentials: this.configService.get('matsConfig.importCredentials'),
      region: this.configService.get('matsConfig.importRegion'),
    });

    return this.s3Client.send(
      new PutObjectCommand({
        Body: file,
        Key: bucketLocation,
        Bucket: this.configService.get('matsConfig.importBucket'),
      }),
    );
  }

  async importFile(
    file: Express.Multer.File,
    monPlanId: string,
    locId: string,
    testTypeCode: string,
    testNumber: string,
    userId: string,
  ) {
    const monitorPlan: MonitorPlan = await MonitorPlan.findOne(monPlanId, {
      relations: ['plant'],
    });
    const testTypeCodeEntity: TestTypeCode = await TestTypeCode.findOne(
      testTypeCode,
    );

    const date = new Date();
    const year = date.getFullYear();
    let quarter;

    if (
      date >= new Date(`${year}-01-01`) &&
      date <= new Date(`${year}-03-31`)
    ) {
      quarter = '1';
    } else if (
      date >= new Date(`${year}-04-01`) &&
      date <= new Date(`${year}-06-30`)
    ) {
      quarter = '2';
    } else if (
      date >= new Date(`${year}-07-01`) &&
      date <= new Date(`${year}-09-30`)
    ) {
      quarter = '3';
    } else {
      quarter = '4';
    }

    const bucketLocation = `${year}/q${quarter}/${monitorPlan.plant.orisCode}/${locId}/${testTypeCode}/${testNumber}/${file.originalname}`;

    await this.uploadFile(file.buffer, bucketLocation);

    const matsBulkFileRecord: MatsBulkFile = MatsBulkFile.create({
      location: locId,
      facIdentifier: monitorPlan.plant.facIdentifier,
      testTypeGroup: testTypeCode,
      testTypeGroupDescription: testTypeCodeEntity.testTypeCodeDescription,
      orisCode: monitorPlan.plant.orisCode,
      facilityName: monitorPlan.plant.facilityName,
      monPlanIdentifier: monPlanId,
      testNumber,
      fileName: file.originalname,
      userId,
      bucketLocation: bucketLocation,
      addDate: new Date(),
    });

    await MatsBulkFile.save(matsBulkFileRecord);
  }
}
