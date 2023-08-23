import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { MatsBulkFile } from '../entities/mats-bulk-file.entity';

@Injectable()
export class MatsFileUploadService {
  private s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {}

  async uploadFile(fileName: string, file: Buffer) {

    const matsConfig = this.configService.get("matsConfig");

    this.s3Client = new S3Client({
      credentials: matsConfig.importCredentials,
      region: matsConfig.importRegion,
    });

    return this.s3Client.send(
      new PutObjectCommand({
        Body: file,
        Key: fileName,
        Bucket: matsConfig.importBucket,
      }),
    );
  }

  async saveImportMetaData(monPlanId: string, testNumber: string, fileName: string, userId: string){

    const monitorPlan: MonitorPlan = await MonitorPlan.findOne(monPlanId, { relations: ["plant"] });
    
    if( !monitorPlan )
    throw new EaseyException(
      new Error(`Monitor Plan with id: ${monPlanId} not found`),
      HttpStatus.NOT_FOUND
    )

    const matsBulkFileRecord: MatsBulkFile  = MatsBulkFile.create({
      facIdentifier: monitorPlan.plant.facIdentifier,
      orisCode: monitorPlan.plant.orisCode,
      facilityName: monitorPlan.plant.facilityName,
      monPlanIdentifier: monPlanId,
      testNumber,
      fileName,
      userId,
      addDate: new Date(),
    });

    await MatsBulkFile.save(matsBulkFileRecord);
  }
}


