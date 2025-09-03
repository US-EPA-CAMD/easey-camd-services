import { CopyObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { Request } from 'express';
import { AxiosResponse } from 'axios';
import { format } from 'date-fns';

import { MatsBulkFile } from '../entities/mats-bulk-file.entity';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { TestTypeCode } from '../entities/test-type-code.entity';
import { MatsDataSubmission } from '../entities/mats-data-submission.entity';
import { MatsDataSubmissionPayloadFile } from '../entities/mats-data-submission-payload-file.entity';
import { Plant } from '../entities/plant.entity';
import { Unit } from '../entities/unit.entity';
import { MonitorLocation } from '../entities/monitor-location.entity';
import { StackPipe } from '../entities/stack-pipe.entity';

import { SubmissionEmailParamsDto } from '../dto/submission-email-params.dto';
import { MatsProcessParamsDTO } from '../dto/mats-process-params.dto';
import { RecipientListService } from '../submission/recipient-list.service';
import { MailEvalService } from '../mail/mail-eval.service';
import { DocumentService } from '../submission/document.service';
import { EvaluationSetHelperService } from '../evaluation/evaluation-set-helper.service';




@Injectable()
export class MatsFileUploadService {
  private s3Client: S3Client;
  private importS3Client: S3Client;
  private mainS3Client: S3Client;


  constructor(
    private readonly configService: ConfigService,
    private readonly entityManager: EntityManager,
    private readonly recipientListService: RecipientListService,
    private readonly mailEvalService: MailEvalService,
    private readonly documentService: DocumentService,
    private readonly evaluationSetHelper: EvaluationSetHelperService,
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {
    this.importS3Client = new S3Client({
      credentials: this.configService.get('matsConfig.importCredentials'),
      region: this.configService.get('matsConfig.importRegion'),
    });

    this.mainS3Client = new S3Client({
      credentials: this.configService.get('matsConfig.globalCredentials'),
      region: this.configService.get('matsConfig.globalRegion'),
    });
  }

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
    const monitorPlan: MonitorPlan = await this.entityManager.findOne(
      MonitorPlan,
      {
        where: { monPlanIdentifier: monPlanId },
        relations: ['plant'],
      },
    );
    const testTypeCodeEntity: TestTypeCode = await this.entityManager.findOneBy(
      TestTypeCode,
      {
        testTypeCode,
      },
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

    const matsBulkFileRecord: MatsBulkFile = this.entityManager.create(
      MatsBulkFile,
      {
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
      },
    );

    await this.entityManager.save(MatsBulkFile, matsBulkFileRecord);
  }

  async matsSubmissionProcess(matsProcessParams: MatsProcessParamsDTO, req: Request) {
    let submission: MatsDataSubmission;
    let payloadFiles: MatsDataSubmissionPayloadFile[];
    const matsDataSubId = matsProcessParams.matsDataSubmissionId;

    this.logger.log(`MATS Submission Process Started for: ${matsDataSubId}`);
    try {
      // Update STARTED_TIME column
      submission = await this.entityManager.findOne(MatsDataSubmission, {
        where: { matsDataSubId }
      });

      if (!submission) {
        throw new EaseyException(new Error(`MATS Data Submission with id ${matsDataSubId} not found.`), HttpStatus.NOT_FOUND);
      }
      submission.queuedTime = new Date();
      submission.startedTime = new Date();
      await this.entityManager.save(submission);


      // Gather documents for CDX submission
      payloadFiles = await this.entityManager.find(MatsDataSubmissionPayloadFile, {
        where: { matsDataSubId },
      });

      const folderPath = join(__dirname, uuidv4());
      mkdirSync(folderPath);

      const documents: any = [];
      // Add MATS Certification Statement
      await this.documentService.addCertificationStatements(submission.monPlanId, documents, true);

      // Writing Certification Statements...
      writeFileSync(`${folderPath}/${documents[0]?.documentTitle}.html`, documents[0]?.context);

      // Download files from import bucket - similar to existing processMatsRecord
      for (const file of payloadFiles) {
        const getObjectResponse = await this.importS3Client.send(
          new GetObjectCommand({
            Bucket: this.configService.get<string>('matsConfig.importBucket'),
            Key: file.tempS3BucketFilePath,
          }),
        );
  
        const filePath = join(folderPath, file.fileName);
        const bodyContents = await getObjectResponse.Body.transformToByteArray();
        writeFileSync(filePath, Buffer.from(bodyContents));
      }

      // Perform CDX submission
      const createActivityRes = await this.createActivity(req, matsProcessParams);
      const activityId = createActivityRes.activityId;
      submission.activityId = activityId;
      this.logger.log(`activityId : ${activityId}`);

      // Send documents for signing
      await this.documentService.sendForSigning(activityId, folderPath);
      await this.entityManager.save(submission);

      // Copy files to main bucket
      for (const file of payloadFiles) {
        await this.mainS3Client.send(
          new CopyObjectCommand({
            CopySource: `${this.configService.get<string>('matsConfig.importBucket')}/${file.tempS3BucketFilePath}`,
            Bucket: this.configService.get<string>('matsConfig.globalBucket'),
            Key: file.tempS3BucketFilePath,
          }),
        );

        file.mainS3BucketFilePath = file.tempS3BucketFilePath;
        file.mainS3BucketFileTime = new Date();
        await this.entityManager.save(file);
      }

      // Send confirmation email
      await this.sendMatsSubmissionConfirmation(submission);

      // Update completion status if no errors
      submission.completedTime = new Date();
      submission.note = null;
      submission.noteTime = null;
      await this.entityManager.save(submission);


    } catch (error) {
      this.logger.error(`Error processing MATS submission ${matsDataSubId}: ${error.message}`);

      // Update error status if error occurred
      if (submission) {
        submission.completedTime = null;
        submission.note = error.message;
        submission.noteTime = new Date();
        await this.entityManager.save(submission);
      }

      throw new EaseyException(error, error.status);

    }
  }

  private async createActivity(req: Request, matsProcessParams: MatsProcessParamsDTO) {
    this.logger.log(`Starting create Activity`);
    // For calling create-activity endpoint
    const token = req.headers.authorization;

    const forwardedForHeader = req.headers["x-forwarded-for"];
    let ip = req.ip;
    if (forwardedForHeader !== null && forwardedForHeader !== undefined) {
      ip = (forwardedForHeader as string)?.split(",")[0];
    }

    const createActivityUSerData = {
      userId: matsProcessParams.userId,
      firstName: matsProcessParams.firstName,
      lastName: matsProcessParams.lastName,
      middleInitial: matsProcessParams.middleInitial,
      activityDescription: matsProcessParams.activityDescription,
    }
    const url = `${this.configService.get<string>('app.authApi.uri')}/sign/create-activity`;
    const body = { ...createActivityUSerData };

    const headers = {
      "x-api-key": this.configService.get<string>('app.apiKey'),
      authorization: `${token}`,
      "x-forwarded-for": ip,
    };
    const response: AxiosResponse<any> = await firstValueFrom(
      this.httpService.post(url, body, { headers }),
    );
    this.logger.log(`End create Activity`);
    return response.data

  }

  async sendMatsSubmissionConfirmation(submission: MatsDataSubmission): Promise<void> {
    let submissionEmailParamsDto = new SubmissionEmailParamsDto();

    const facility: Plant = await this.entityManager.findOne(Plant, {
      where: { facIdentifier: submission.facId },
    });
    const matsSubmissionWithLocation = await this.getMatsSubmissionWithLocation(submission.monLocId)
    const primaryLocation = matsSubmissionWithLocation?.primary_location;


    const subject: string = `MATS Data Submission Feedback for ORIS Code ${facility.orisCode} ${primaryLocation}`

    //Get the recipients list from the recipient's list API
    const recipientsListApiEnabled = this.configService.get<boolean>('app.recipientsListApiEnabled');

    submissionEmailParamsDto.toEmail = submission.userEmail;
    submissionEmailParamsDto.ccEmail = recipientsListApiEnabled ? await this.recipientListService.getEmailRecipients(
      submission.userId,
      'PDF',
      true,
      'SUBMISSIONCONFIRMATION',
      submission.facId?.toString(),
    ) : '';

    let supportEmail: string;
    try {
      const ecmpsClientConfig = await this.evaluationSetHelper.getECMPSClientConfig();
      supportEmail = ecmpsClientConfig?.supportEmail?.trim?.() || 'ecmps-support@camdsupport.com';
    } catch (configError) {
      supportEmail = 'ecmps-support@camdsupport.com';
      this.logger.error('Failed to get support email. Using: ' + supportEmail, configError.stack,);
    }

    const now = new Date();
    const currentDate = format(now, 'MM/dd/yyyy HH:mm:ss');


    submissionEmailParamsDto.templateContext['PLANT_NAME'] = facility.facilityName;
    submissionEmailParamsDto.templateContext['PLANT_STATE'] = facility.state;
    submissionEmailParamsDto.templateContext['ORIS_CODE'] = facility.orisCode;
    submissionEmailParamsDto.templateContext['LOCATION_LIST'] = primaryLocation;
    submissionEmailParamsDto.templateContext['SUBMISSION_DATE'] = currentDate; //submission.completedTime will after email send
    submissionEmailParamsDto.templateContext['supportEmail'] = supportEmail;

    await this.mailEvalService.sendEmailWithRetry(
      submissionEmailParamsDto.toEmail,
      submissionEmailParamsDto.ccEmail,
      this.configService.get<string>('app.defaultFromEmail'),
      subject,
      'matsSubmissionTemplate',
      submissionEmailParamsDto.templateContext,
      1,
    );
  }

  async getMatsSubmissionWithLocation(monLocId: string) {
    return await this.entityManager
      .createQueryBuilder()
      .select([
        'mats.mon_loc_id',
        'COALESCE(sp.stack_name, u.unitid) AS primary_location',
      ])
      .from(MatsDataSubmission, 'mats')
      .innerJoin(MonitorLocation, 'ml', 'mats.mon_loc_id = ml.mon_loc_id')
      .leftJoin(StackPipe, 'sp', 'ml.stack_pipe_id = sp.stack_pipe_id')
      .leftJoin(Unit, 'u', 'ml.unit_id = u.unit_id')
      .where('mats.mon_loc_id = :monLocId', { monLocId })
      .getRawOne();
  }

}
