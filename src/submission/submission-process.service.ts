import { HttpStatus, Injectable, Param } from '@nestjs/common';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { DataSetService } from '../dataset/dataset.service';
import { getManager } from 'typeorm';
import { SubmissionSet } from '../entities/submission-set.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import { CopyOfRecordService } from '../copy-of-record/copy-of-record.service';
import { ReportParamsDTO } from '../dto/report-params.dto';
import * as path from 'path';
import * as FormData from 'form-data';
import {
  writeFileSync,
  mkdirSync,
  readdirSync,
  createReadStream,
  rmSync,
} from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { HttpService } from '@nestjs/axios';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { QaCertEvent } from '../entities/qa-cert-event.entity';
import { QaTee } from '../entities/qa-tee.entity';
import { EmissionEvaluation } from '../entities/emission-evaluation.entity';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { QaSuppData } from '../entities/qa-supp.entity';
import { ConfigService } from '@nestjs/config';
import { ReportingPeriod } from '../entities/reporting-period.entity';
import { MailEvalService } from '../mail/mail-eval.service';
import { MatsBulkFile } from '../entities/mats-bulk-file.entity';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SubmissionProcessService {
  private importS3Client: S3Client;
  private globalS3Client: S3Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
    private dataSetService: DataSetService,
    private copyOfRecordService: CopyOfRecordService,
    private readonly httpService: HttpService,
    private mailEvalService: MailEvalService,
  ) {
    this.importS3Client = new S3Client({
      credentials: this.configService.get('matsConfig.importCredentials'),
      region: this.configService.get('matsConfig.importRegion'),
    });

    this.globalS3Client = new S3Client({
      credentials: this.configService.get('matsConfig.globalCredentials'),
      region: this.configService.get('matsConfig.globalRegion'),
    });
  }

  returnManager(): any {
    return getManager();
  }

  async addEvalReports(
    set: SubmissionSet,
    records: SubmissionQueue[],
    documents: object[],
  ) {
    for (const rec of records) {
      if (['CRIT1', 'CRIT2', 'CRIT3', 'FATAL'].includes(rec.severityCode)) {
        const params = new ReportParamsDTO();
        params.facilityId = set.orisCode;

        let titleContext = '';

        // Add Eval Report
        if (rec.processCode === 'MP') {
          titleContext = 'MP_EVAL' + set.monPlanIdentifier;
          params.reportCode = 'MP_EVAL';
          params.monitorPlanId = set.monPlanIdentifier;
        } else if (rec.testSumIdentifier != null) {
          titleContext = 'TEST_DETAIL_EVAL';
          params.reportCode = 'TEST_EVAL';
          params.testId = [rec.testSumIdentifier];
        } else if (rec.qaCertEventIdentifier != null) {
          titleContext = 'QCE_EVAL';
          params.reportCode = 'QCE_EVAL';
          params.qceId = [rec.qaCertEventIdentifier];
        } else if (rec.testExtensionExemptionIdentifier != null) {
          titleContext = 'TEE_EVAL';
          params.reportCode = 'TEE_EVAL';
          params.teeId = [rec.testExtensionExemptionIdentifier];
        } else if (rec.processCode === 'EM') {
          const rptPeriod: ReportingPeriod = await this.returnManager().findOne(
            ReportingPeriod,
            {
              where: { rptPeriodIdentifier: rec.rptPeriodIdentifier },
            },
          );

          params.reportCode = 'EM_EVAL';
          params.monitorPlanId = set.monPlanIdentifier;
          params.year = rptPeriod.calendarYear;
          params.quarter = rptPeriod.quarter;

          titleContext =
            'EM_EVAL_' +
            params.monitorPlanId +
            '_' +
            params.year +
            'q' +
            params.quarter;
        }

        const reportInformation = await this.dataSetService.getDataSet(
          params,
          true,
        );

        documents.push({
          documentTitle: `${set.orisCode}_${titleContext}`,
          context:
            this.copyOfRecordService.generateCopyOfRecord(reportInformation),
        });
      }
    }
  }

  async buildDocuments(
    set: SubmissionSet,
    records: SubmissionQueue[],
    documents: object[],
    processCd: string,
  ) {
    // -- MONITOR PLAN COR --------------------
    const params = new ReportParamsDTO();
    params.facilityId = set.orisCode;
    let titleContext = '';

    switch (processCd) {
      case 'MP':
        params.reportCode = 'MPP';
        params.monitorPlanId = set.monPlanIdentifier;
        titleContext = 'MP_' + set.monPlanIdentifier;
        break;
      case 'QA_TEST':
        params.reportCode = 'TEST_DETAIL';
        params.testId = records
          .filter((r) => r.testSumIdentifier !== null)
          .map((o) => o.testSumIdentifier);
        titleContext = 'TEST_DETAIL';

        break;
      case 'QA_QCE':
        params.reportCode = 'QCE';
        params.qceId = records
          .filter((r) => r.qaCertEventIdentifier !== null)
          .map((o) => o.qaCertEventIdentifier);
        titleContext = 'QCE';
        break;
      case 'QA_TEE':
        params.reportCode = 'TEE';
        params.teeId = records
          .filter((r) => r.testExtensionExemptionIdentifier !== null)
          .map((o) => o.testExtensionExemptionIdentifier);
        titleContext = 'TEE';
        break;
      case 'EM':
        const emRecord = records.find((r) => r.processCode === 'EM');
        params.reportCode = 'EM';
        params.monitorPlanId = set.monPlanIdentifier;
        const rptPeriod: ReportingPeriod = await this.returnManager().findOne(
          ReportingPeriod,
          {
            where: { rptPeriodIdentifier: emRecord.rptPeriodIdentifier },
          },
        );

        params.year = rptPeriod.calendarYear;
        params.quarter = rptPeriod.quarter;

        titleContext =
          'EM_' +
          params.monitorPlanId +
          '_' +
          params.year +
          'q' +
          params.quarter;

        break;
    }

    const reportInformation = await this.dataSetService.getDataSet(
      params,
      true,
    );

    documents.push({
      documentTitle: `${set.orisCode}_${titleContext}`,
      context: this.copyOfRecordService.generateCopyOfRecord(reportInformation),
    });
  }

  async buildTransactions(
    set: SubmissionSet,
    record: SubmissionQueue,
    documents: object[],
    transactions: any[],
    folderPath: string,
  ): Promise<void> {
    switch (record.processCode) {
      case 'MP':
        transactions.push({
          command:
            'CALL camdecmps.copy_monitor_plan_from_workspace_to_global($1)',
          params: [set.monPlanIdentifier],
        });
        break;
      case 'QA':
        if (record.testSumIdentifier) {
          transactions.push({
            command:
              'CALL camdecmps.copy_qa_test_summary_from_workspace_to_global($1)',
            params: [record.testSumIdentifier],
          });
        } else if (record.qaCertEventIdentifier) {
          transactions.push({
            command:
              'CALL camdecmps.copy_qa_qce_data_from_workspace_to_global($1)',
            params: [record.qaCertEventIdentifier],
          });
        } else {
          transactions.push({
            command:
              'CALL camdecmps.copy_qa_tee_data_from_workspace_to_global($1)',
            params: [record.testExtensionExemptionIdentifier],
          });
        }
        break;
      case 'EM':
        transactions.push({
          command:
            'CALL camdecmps.copy_emissions_from_workspace_to_global($1, $2)',
          params: [set.monPlanIdentifier, record.rptPeriodIdentifier],
        });
        break;
      case 'MATS':
        //Pull down the Mats Bulk File Object
        const matsRecord: MatsBulkFile = await this.returnManager().findOne(
          MatsBulkFile,
          {
            where: {
              id: record.matsBulkFileId,
            },
          },
        );

        const response = await this.importS3Client.send(
          new GetObjectCommand({
            Bucket: this.configService.get<string>('matsConfig.importBucket'),
            Key: matsRecord.bucketLocation,
          }),
        );
        const responseString = await response.Body.transformToString();

        writeFileSync(
          `${folderPath}/MATS_${set.monPlanIdentifier}_${matsRecord.testTypeGroup}_${matsRecord.testNumber}_${matsRecord.fileName}`,
          responseString,
        );

        //Upload the Mats Bulk File Object to the global bucket
        await this.globalS3Client.send(
          new PutObjectCommand({
            Body: responseString,
            Key: matsRecord.bucketLocation,
            Bucket: this.configService.get<string>('matsConfig.globalBucket'),
          }),
        );

        break;
    }
  }

  async setRecordStatusCode(
    set: SubmissionSet,
    records: SubmissionQueue[],
    statusCode: string,
    details: string,
    originRecordCode: string,
  ) {
    for (const record of records) {
      record.statusCode = statusCode;
      record.details = details;

      let originRecord;

      switch (record.processCode) {
        case 'MP':
          originRecord = await this.returnManager().findOne(
            MonitorPlan,
            set.monPlanIdentifier,
          );

          break;
        case 'QA':
          if (record.testSumIdentifier) {
            originRecord = await this.returnManager().findOne(QaSuppData, {
              where: { testSumId: record.testSumIdentifier },
            });
          } else if (record.qaCertEventIdentifier) {
            originRecord = await this.returnManager().findOne(
              QaCertEvent,
              record.qaCertEventIdentifier,
            );
          } else {
            originRecord = await this.returnManager().findOne(
              QaTee,
              record.testExtensionExemptionIdentifier,
            );
          }
          break;
        case 'EM':
          originRecord = await this.returnManager().findOne(
            EmissionEvaluation,
            {
              where: {
                monPlanIdentifier: set.monPlanIdentifier,
                rptPeriodIdentifier: record.rptPeriodIdentifier,
              },
            },
          );

          if (originRecordCode === 'UPDATED') {
            await this.returnManager().query(
              //Close the EM submission access window
              `UPDATE camdecmpsaux.em_submission_access
                SET em_status_cd = $1, sub_availability_cd = $2
                WHERE mon_plan_id = $3
                  AND rpt_period_id = $4
                  AND access_begin_date = (SELECT MAX(access_begin_date)
                                            FROM camdecmpsaux.em_submission_access
                                            WHERE mon_plan_id = $3 AND rpt_period_id = $4);`,
              [
                'RECVD',
                'UPDATED',
                set.monPlanIdentifier,
                record.rptPeriodIdentifier,
              ],
            );
          }

          break;
        case 'MATS':
          originRecord = await this.returnManager().findOne(MatsBulkFile, {
            where: {
              id: record.matsBulkFileId,
            },
          });
          break;
      }

      if (originRecord) {
        originRecord.submissionIdentifier = record.submissionIdentifier;
        originRecord.submissionAvailabilityCode = originRecordCode;

        await this.returnManager().save(originRecord);
      }
      await this.returnManager().save(record);
    }
  }

  async handleError(set: SubmissionSet, queue: SubmissionQueue[], e: Error) {
    set.details = JSON.stringify(e);
    set.statusCode = 'ERROR';
    set.endStageTime = currentDateTime();

    await this.setRecordStatusCode(
      //Reset the original records to require
      set,
      queue,
      'ERROR',
      'Process failure, see set details',
      'REQUIRE',
    );

    await this.returnManager().save(set);

    const errorId = uuidv4();

    let logMetadata = {
      appName: 'ecmps-ui',
      stack: e.stack,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorId: errorId,
    };

    this.logger.error(e.message, e.stack, 'submission', logMetadata);

    await this.mailEvalService.sendMassEvalEmail(
      set.userEmail,
      this.configService.get<string>('app.defaultFromEmail'),
      set.submissionSetIdentifier,
      false,
      true,
      errorId,
    );

    throw new EaseyException(e, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  async successCleanup(
    folderPath,
    set: SubmissionSet,
    submissionSetRecords,
    transactions,
  ) {
    try {
      rmSync(folderPath, {
        recursive: true,
        maxRetries: 5,
        retryDelay: 1,
        force: true,
      });

      if (!set.hasCritErrors) {
        await this.returnManager().transaction(
          //Copy records from workspace to global
          async (transactionalEntityManager) => {
            try {
              for (const trans of transactions) {
                await transactionalEntityManager.query(
                  trans.command,
                  trans.params,
                );
              }
            } catch (error) {
              await this.handleError(set, submissionSetRecords, error);
            }
          },
        );
      }

      await this.setRecordStatusCode(
        set,
        submissionSetRecords,
        'COMPLETE',
        '',
        set.hasCritErrors ? 'CRITERR' : 'UPDATED',
      );

      set.statusCode = 'COMPLETE';
      set.endStageTime = currentDateTime();
      await this.returnManager().save(set);
    } catch (e) {
      await this.handleError(set, submissionSetRecords, e);
    }

    this.mailEvalService.sendMassEvalEmail(
      set.userEmail,
      this.configService.get<string>('app.defaultFromEmail'),
      set.submissionSetIdentifier,
      true,
      false,
      '',
      set.hasCritErrors,
    );

    this.logger.log('Finished processing copy of record');
  }

  async processSubmissionSet(id: string): Promise<void> {
    this.logger.log(`Processing copy of record for: ${id}`);

    let set: SubmissionSet;
    let submissionSetRecords: SubmissionQueue[];

    try {
      set = await this.returnManager().findOne(SubmissionSet, id);

      set.statusCode = 'WIP';
      set.endStageTime = currentDateTime();

      await this.returnManager().save(set);

      submissionSetRecords = await this.returnManager().find(SubmissionQueue, {
        where: { submissionSetIdentifier: id },
      });

      await this.setRecordStatusCode(
        set,
        submissionSetRecords,
        'WIP',
        '',
        'PENDING',
      );

      const values = {
        //Order which to process copy of records
        MP: 1,
        QA: 2,
        EM: 3,
        MATS: 4,
      };

      submissionSetRecords = submissionSetRecords.sort((a, b) => {
        return values[a.processCode] - values[b.processCode];
      });

      const fileBucket = uuidv4();

      const folderPath = path.join(__dirname, fileBucket);

      mkdirSync(folderPath);

      // Iterate each record in the submission queue linked to the set and create a promise that resolves with the addition of document html string in the documents array
      const documents = [];
      const transactions: any = [];

      for (const submissionRecord of submissionSetRecords) {
        await this.buildTransactions(
          set,
          submissionRecord,
          documents,
          transactions,
          folderPath,
        );
      }

      //Build Copy of Records ---
      await this.addEvalReports(set, submissionSetRecords, documents);

      if (
        submissionSetRecords.filter((r) => r.processCode === 'MP').length > 0
      ) {
        await this.buildDocuments(set, submissionSetRecords, documents, 'MP');
      }

      if (
        submissionSetRecords.filter(
          (r) => r.processCode === 'QA' && r.testSumIdentifier,
        ).length > 0
      ) {
        await this.buildDocuments(
          set,
          submissionSetRecords,
          documents,
          'QA_TEST',
        );
      }

      if (
        submissionSetRecords.filter(
          (r) => r.processCode === 'QA' && r.qaCertEventIdentifier,
        ).length > 0
      ) {
        await this.buildDocuments(
          set,
          submissionSetRecords,
          documents,
          'QA_QCE',
        );
      }

      if (
        submissionSetRecords.filter(
          (r) => r.processCode === 'QA' && r.testExtensionExemptionIdentifier,
        ).length > 0
      ) {
        await this.buildDocuments(
          set,
          submissionSetRecords,
          documents,
          'QA_TEE',
        );
      }

      if (
        submissionSetRecords.filter((r) => r.processCode === 'EM').length > 0
      ) {
        await this.buildDocuments(set, submissionSetRecords, documents, 'EM');
      }

      // Handle Certification Statements

      const obs = this.httpService.get(
        `${this.configService.get<string>(
          'app.authApi.uri',
        )}/certifications/statements?monitorPlanIds=${set.monPlanIdentifier}`,
        {
          headers: {
            'x-api-key': this.configService.get<string>('app.apiKey'),
          },
        },
      );

      const statements = (await firstValueFrom(obs)).data;

      documents.push({
        documentTitle: `Certification Statements`,
        context: this.copyOfRecordService.generateCopyOfRecordCert(statements),
      });

      //--------------------------

      //Write the document strings to html files
      for (const doc of documents) {
        writeFileSync(`${folderPath}/${doc.documentTitle}.html`, doc.context);
      }

      // Read files from the new directory and attach them to the outgoing sign request
      const files = readdirSync(folderPath);
      const formData = new FormData();

      for (const file of files) {
        const filePath = path.join(folderPath, file);
        formData.append('files', createReadStream(filePath), file);
      }

      formData.append('activityId', set.activityId);

      const signObs = this.httpService.post(
        `${this.configService.get<string>('app.authApi.uri')}/sign`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'x-api-key': this.configService.get<string>('app.apiKey'),
          },
        },
      );

      signObs.subscribe({
        //Handle transmission cleanup / error handling
        error: (e) => {
          this.handleError(set, submissionSetRecords, e);
          rmSync(folderPath, {
            recursive: true,
            maxRetries: 5,
            retryDelay: 1,
            force: true,
          });
        },
        next: () => {
          //After copy of record is successful we need to remove the file directory and copy the workspace data in a transaction
          this.successCleanup(
            folderPath,
            set,
            submissionSetRecords,
            transactions,
          );
        },
      });
    } catch (e) {
      await this.handleError(set, submissionSetRecords, e);
    }
  }
}
