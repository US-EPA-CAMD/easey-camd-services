import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';
import * as FormData from 'form-data';
import {
  createReadStream,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'fs';
import * as path from 'path';
import { firstValueFrom } from 'rxjs';
import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { CopyOfRecordService } from '../copy-of-record/copy-of-record.service';
import { DataSetService } from '../dataset/dataset.service';
import { ReportParamsDTO } from '../dto/report-params.dto';
import { EmissionEvaluation } from '../entities/emission-evaluation.entity';
import { MatsBulkFile } from '../entities/mats-bulk-file.entity';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { QaCertEvent } from '../entities/qa-cert-event.entity';
import { QaSuppData } from '../entities/qa-supp.entity';
import { QaTee } from '../entities/qa-tee.entity';
import { ReportingPeriod } from '../entities/reporting-period.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import { SubmissionSet } from '../entities/submission-set.entity';
import { MailEvalService } from '../mail/mail-eval.service';
import { ClientConfig } from '../entities/client-config.entity';
import {
  HighestSeverityRecord,
  isCritical1Severity, isResubmissionRequired, KeyValuePairs,
  SubmissionEmailParamsDto,
} from '../dto/submission-email-params.dto';
import { SubmissionFeedbackRecordService } from './submission-feedback-record.service';
import { SeverityCode } from '../entities/severity-code.entity';

@Injectable()
export class SubmissionProcessService {
  private importS3Client: S3Client;
  private globalS3Client: S3Client;

  constructor(
    private readonly entityManager: EntityManager,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
    private dataSetService: DataSetService,
    private copyOfRecordService: CopyOfRecordService,
    private readonly httpService: HttpService,
    private mailEvalService: MailEvalService,
    private submissionFeedbackRecordService: SubmissionFeedbackRecordService,
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

  returnManager(): EntityManager {
    return this.entityManager;
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
          const rptPeriod: ReportingPeriod =
            await this.returnManager().findOneBy(ReportingPeriod, {
              rptPeriodIdentifier: rec.rptPeriodIdentifier,
            });

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
        const rptPeriod: ReportingPeriod =
          emRecord.rptPeriodIdentifier &&
          (await this.returnManager().findOneBy(ReportingPeriod, {
            rptPeriodIdentifier: emRecord.rptPeriodIdentifier,
          }));

        params.year = rptPeriod?.calendarYear;
        params.quarter = rptPeriod?.quarter;

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
    transactions: any[],
    folderPath: string,
  ): Promise<void> {
    switch (record.processCode) {
      case 'MP': {
        transactions.push({
          command:
            'CALL camdecmps.copy_monitor_plan_from_workspace_to_global($1)',
          params: [set.monPlanIdentifier],
        });
        break;
      }
      case 'QA': {
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
      }
      case 'EM': {
        transactions.push({
          command:
            'CALL camdecmps.copy_emissions_from_workspace_to_global($1, $2)',
          params: [set.monPlanIdentifier, record.rptPeriodIdentifier],
        });
        break;
      }
      case 'MATS': {
        //Pull down the Mats Bulk File Object
        const matsRecord: MatsBulkFile = await this.returnManager().findOneBy(
          MatsBulkFile,
          {
            id: record.matsBulkFileId,
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
          originRecord = await this.returnManager().findOneBy(MonitorPlan, {
            monPlanIdentifier: set.monPlanIdentifier,
          });

          break;
        case 'QA':
          if (record.testSumIdentifier) {
            originRecord = await this.returnManager().findOneBy(QaSuppData, {
              testSumId: record.testSumIdentifier,
            });
          } else if (record.qaCertEventIdentifier) {
            originRecord = await this.returnManager().findOneBy(QaCertEvent, {
              qaCertEventIdentifier: record.qaCertEventIdentifier,
            });
          } else {
            originRecord = await this.returnManager().findOneBy(QaTee, {
              testExtensionExemptionIdentifier:
                record.testExtensionExemptionIdentifier,
            });
          }
          break;
        case 'EM':
          originRecord = await this.returnManager().findOneBy(
            EmissionEvaluation,
            {
              monPlanIdentifier: set.monPlanIdentifier,
              rptPeriodIdentifier: record.rptPeriodIdentifier,
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
          originRecord = await this.returnManager().findOneBy(MatsBulkFile, {
            id: record.matsBulkFileId,
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

  async handleError(set: SubmissionSet, queue: SubmissionQueue[], e: Error, submissionSucceeded: boolean) {
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

    //If the submission did not succeed, do not send feedback email...
    if (submissionSucceeded) {
      this.logger.debug("Sending feedback Email...");
      await this.sendFeedbackReportEmail(
        set.userEmail,
        this.configService.get<string>('app.defaultFromEmail'),
        set.submissionSetIdentifier,
        true,
        errorId
      );
    }

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
              this.logger.error("successCleanup: error while cleaning up ", error)
              await this.handleError(set, submissionSetRecords, error, true);
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
      this.logger.error("successCleanup: error while cleaning up ... ", e)
      await this.handleError(set, submissionSetRecords, e, true);
    }

    this.sendFeedbackReportEmail(
      set.userEmail,
      this.configService.get<string>('app.defaultFromEmail'),
      set.submissionSetIdentifier,
      false,
      ''
    );

    this.logger.log('Finished processing copy of record');
  }

  async processSubmissionSet(id: string): Promise<void> {
    this.logger.log(`Processing copy of record for: ${id}`);

    let set: SubmissionSet;
    let submissionSetRecords: SubmissionQueue[];

    try {
      this.logger.log(`Fetching SubmissionSet for submissionSetIdentifier: ${id}`);
      set = await this.returnManager().findOneBy(SubmissionSet, {
        submissionSetIdentifier: id,
      });
      this.logger.log('Retrieved SubmissionSet', set);

      set.statusCode = 'WIP';
      set.endStageTime = currentDateTime();

      this.logger.log('Attempting to save SubmissionSet', set);
      await this.returnManager().save(set);
      this.logger.log('Successfully saved SubmissionSet');

      submissionSetRecords = await this.returnManager().findBy(
        SubmissionQueue,
        {
          submissionSetIdentifier: id,
        },
      );

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
          this.handleError(set, submissionSetRecords, e, true);
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
      this.logger.error("processSubmissionSet: error while processing submission set. ", e)
      await this.handleError(set, submissionSetRecords, e, false);
    }
  }

  async sendFeedbackReportEmail(
    to: string,
    from: string,
    setId: string,
    isSubmissionFailure: boolean,
    errorId: string = '',
  ) {

    this.logger.debug('Starting sending feedback reports email ', { setId});

    //Retrieve the severity codes so that we can find the submission queue record with the highest severity code
    //to use as the email subject
    const severityCodes: SeverityCode[] = await this.returnManager().find(SeverityCode);

    // Get complete data for all file types for Submission
    const submissionSet = await this.returnManager().findOneBy(SubmissionSet, {
      submissionSetIdentifier: setId,
    });
    this.logger.debug(`Retrieved submission set with ID: ${submissionSet ? submissionSet.submissionSetIdentifier : null}`);

    const submissionQueueRecords = await this.returnManager().find(SubmissionQueue, {
      where: { submissionSetIdentifier: setId },
    });
    this.logger.debug(`Number of retrieved submission queue records: ${Array.isArray(submissionQueueRecords) ? submissionQueueRecords.length : 0}`);

    //Send a separate feedback email for the submission, with evaluation reports attached for each file type. First group the submissionQueueRecords by file type.
    const submissionRecordsByFileType = {

      MP: {
        processCode: 'MP',
        records: [submissionQueueRecords.find((r) => r.processCode === 'MP')].filter(Boolean)
      },

      // Separate QA records based on severityCode so that CRIT1 records are sent in one feedback email whereas
      // Non-CRIT1 are sent in a separate email.
      qaCriticalRecords: {
        processCode: 'QA',
        records: [
          ...submissionQueueRecords.filter(
            (r) => r.processCode === 'QA' && r.severityCode === 'CRIT1' && (r.testSumIdentifier !== null || r.qaCertEventIdentifier !== null || r.testExtensionExemptionIdentifier !== null)
          ),
        ],
      },

      qaNonCriticalRecords: {
        processCode: 'QA',
        records: [
          ...submissionQueueRecords.filter(
            (r) => r.processCode === 'QA' && r.severityCode !== 'CRIT1' && (r.testSumIdentifier !== null || r.qaCertEventIdentifier !== null || r.testExtensionExemptionIdentifier !== null)
          ),
        ],
      },

      //We need to process EM records differently. WE will send a separate email for each EM record in the
      //submission queue table. Therefore, we will store them separately.
      ...submissionQueueRecords
        .filter((r) => r.processCode === 'EM')
        .reduce((acc, record, index) => {
          acc[`EM_${index}`] = { processCode: 'EM', records: [record] };
          return acc;
        }, {}),

      MATS: {
        processCode: 'MATS',
        records: submissionQueueRecords.filter((r) => r.processCode === 'MATS')
      }
    };

    const promises = [];

    //Now, loop through each submission grouping and send one email for each group (file type)
    for (const [key, { processCode, records }] of Object.entries(submissionRecordsByFileType)) {

      this.logger.debug(`Number of ${key} submission records to process: ${records.length}`);
      if (records.length > 0) {

        //If it is an EM record, then we need reporting period information
        let rptPeriod : ReportingPeriod = null;
        if (processCode === 'EM') {
          rptPeriod = await this.returnManager().findOneBy(ReportingPeriod, {
            rptPeriodIdentifier: records[0].rptPeriodIdentifier,
          });
        }

        const submissionEmailParamsDto = new SubmissionEmailParamsDto({
          submissionSet: submissionSet,
          submissionRecords: records,
          highestSeverityRecord: await this.findRecordWithHighestSeverityLevel(records, severityCodes),
          processCode: processCode,
          rptPeriod: rptPeriod,
          toEmail: to,
          fromEmail: from,
          //ccEmail: ?  // TODO, dependent on Issue/ticket #6183
          isSubmissionFailure: isSubmissionFailure,
          submissionError: errorId,
        });

        //Send the feedback email
        this.logger.debug('Sending feedback email with params ', {submissionEmailParamsDto});
        promises.push(this.sendFeedbackEmail(submissionEmailParamsDto));
      }
    }

    // Wait for all promises to resolve
    await Promise.all(promises);
  }

  async sendFeedbackEmail(submissionEmailParamsDto : SubmissionEmailParamsDto) {
    const submissionSet = submissionEmailParamsDto.submissionSet;
    const submissionRecords = submissionEmailParamsDto.submissionRecords;
    this.logger.debug('Sending ${firstSubmissionQueue.processCode} submission feedback email.' );

    //Set common template context values here
    this.logger.debug('Setting common template context parameters with ', {submissionEmailParamsDto});
    await this.setCommonParams(submissionEmailParamsDto);

    //1. Create the email content
    this.logger.debug('Creating the email content. ');
    const emailTemplate = 'submissionTemplate';
    const subject = await this.getEmailSubject(submissionEmailParamsDto);
    this.logger.debug('with subject: ', subject);

    //2. Create the first page of the attachment page
    this.logger.debug('Creating the submission feedback email attachment. ');
    let attachmentContent = this.submissionFeedbackRecordService.createSubmissionFeedbackEmailAttachment(submissionEmailParamsDto);

    //Add table 1 of the email attachment content
    this.logger.debug('Creating table 1 ( Submission Receipt and Feedback Status Level Information) of the attachment. ');
    const submissionReceiptData = await this.gatherSubmissionReceiptData(submissionEmailParamsDto);
    let submissionReceiptTableContent = this.submissionFeedbackRecordService.getSubmissionReceiptTableContent(submissionReceiptData);
    submissionReceiptTableContent = submissionReceiptTableContent?.trim() ? submissionReceiptTableContent : 'No Data Available';
    attachmentContent = attachmentContent.replace('{{TABLE_1}}', submissionReceiptTableContent);

    //3. If this is an EM, create the second page of the attachment, which is the EM quarterly summary page
    if (submissionEmailParamsDto.processCode === 'EM') {
      this.logger.debug('Creating the emissions quarterly summary content of the attachment. ');
      let emissionSummaryContent = await this.getEmissionsSummaryReport(submissionEmailParamsDto);
      emissionSummaryContent = emissionSummaryContent?.trim() ? emissionSummaryContent : 'No Data Available';
      emissionSummaryContent = '<h3>Table 2: Cumulative Data Summary -- EPA-Accepted Values</h3> <div> ' + emissionSummaryContent + '</div>';
      attachmentContent = attachmentContent.replace('{{SUMMARY_DATA}}', emissionSummaryContent);
    } else {
      attachmentContent = attachmentContent.replace('{{SUMMARY_DATA}}', '');
    }

    //4. Create the evaluation pages for that file type
    this.logger.debug('Creating the evaluation reports of the attachment. ');
    const evaluationReportDocuments = [];
    await this.mailEvalService.buildEvalReports(submissionSet, submissionRecords, evaluationReportDocuments);
    let evaluationReportsContent = '';
    for (const report of evaluationReportDocuments) {
      evaluationReportsContent += this.extractBodyContent(report.content);
    }
    evaluationReportsContent = evaluationReportsContent?.trim() ? evaluationReportsContent : 'No Data Available';
    attachmentContent = attachmentContent.replace('{{EVALUATION_RESULTS}}', evaluationReportsContent);

    //5. Combine all the content into one attachment file
    this.logger.debug('Compiling all attachment contents in to one attachment file. ');
    const submissionFeedbackAttachmentFileName='SUBMISSION_FEEDBACK';
    const feedbackAttachmentDocuments = [];
    feedbackAttachmentDocuments.push({
      filename: `${submissionSet.orisCode}_${submissionFeedbackAttachmentFileName}.html`,
      content: attachmentContent,
    });

    //6. Finally, send the email
    this.logger.debug('Sending email with attachment ...');
    this.mailEvalService.sendEmailWithRetry(
      submissionEmailParamsDto.toEmail,
      submissionEmailParamsDto.fromEmail,
      subject,
      emailTemplate,
      submissionEmailParamsDto.templateContext,
      1,
      feedbackAttachmentDocuments,
    );

  }

  private async gatherSubmissionReceiptData(submissionEmailParamsDto : SubmissionEmailParamsDto) : Promise<KeyValuePairs> {
    let submissionType = await this.getSubmissionType(submissionEmailParamsDto);
    if (submissionEmailParamsDto.processCode === 'EM') {
      submissionType = submissionType + ' for ' + submissionEmailParamsDto.rptPeriod.periodAbbreviation;
    }

    const epaAnalystLink = this.configService.get<string>('app.epaAnalystLink')?.trim() ?? '';

    const submissionReceiptData: KeyValuePairs = {
      'Report Received for Facility ID (ORIS Code):': submissionEmailParamsDto.templateContext['monitorPlan'].item.orisCode,
      'Facility Name:': submissionEmailParamsDto.templateContext['monitorPlan'].item.facilityName,
      'State:': submissionEmailParamsDto.templateContext['monitorPlan'].item.stateCode,
      'Monitoring Location(s):': submissionEmailParamsDto.templateContext['monitorPlan'].item.configuration,
      'Submission Type:': submissionType,
      'Feedback Status Level:': submissionEmailParamsDto?.highestSeverityRecord?.severityCode?.severityCodeDescription,
      'Submission Date/Time:': submissionEmailParamsDto.templateContext['monitorPlan'].item.submissionDateDisplay,
      'Submitter User ID:': submissionEmailParamsDto.submissionSet.userIdentifier,
      'Submission ID:': submissionEmailParamsDto.submissionSet.submissionSetIdentifier,
      'Resubmission Required:': isResubmissionRequired(submissionEmailParamsDto.highestSeverityRecord) ? 'Yes' : 'No',
      'EPA Analyst:': { label: 'View Analyst', url: epaAnalystLink },
    };

    return submissionReceiptData;
  }

  private async setCommonParams(submissionEmailParamsDto : SubmissionEmailParamsDto): Promise<void> {

    const submissionSet = submissionEmailParamsDto.submissionSet;
    const toEmail = submissionEmailParamsDto.toEmail;
    const ccEmail = submissionEmailParamsDto.ccEmail;

    const facilityInfoList = await this.returnManager().query(
      `
          select  fac.oris_code,
                  fac.facility_name,
                  string_agg(coalesce(unt.Unitid, stp.Stack_Name), ', ') as location_name,
                  fac.state,
                  string_agg(mpl.mon_loc_id, ', ') as mon_location_ids
          from  camdecmps.MONITOR_PLAN_LOCATION mpl
                    join camdecmps.MONITOR_LOCATION loc
                         on loc.Mon_Loc_Id = mpl.Mon_Loc_Id
                    left join camd.UNIT unt
                              on unt.Unit_Id = loc.Unit_Id
                    left join camdecmps.STACK_PIPE stp
                              on stp.Stack_Pipe_Id = loc.Stack_Pipe_Id
                    join camd.PLANT fac
                         on fac.Fac_Id in (unt.Fac_Id, stp.Fac_Id)
          where  mpl.mon_plan_id = $1
          group by fac.oris_code, fac.facility_name, fac.state
      `,
      [submissionSet.monPlanIdentifier],
    );

    //There should only be one result item coming from the query
    const facilityItem = facilityInfoList.length > 0 ? facilityInfoList[0] : {};
    submissionEmailParamsDto.monLocationIds = facilityItem.mon_location_ids;
    submissionEmailParamsDto.facilityName = facilityItem.facility_name;
    submissionEmailParamsDto.orisCode = facilityItem.state;
    submissionEmailParamsDto.stateCode = facilityItem.mon_location_ids;
    submissionEmailParamsDto.unitStackPipe = facilityItem.location_name;

    const mpKeys = [
      'submissionType',
      'facilityName',
      'configuration',
      'orisCode',
      'stateCode',
      'county',
      'unitStackPipe',
      'submissionDateDisplay',
    ];

    submissionEmailParamsDto.templateContext['monitorPlan'] = {
      keys: mpKeys,
      item: {
        'submissionType': this.getSubmissionType(submissionEmailParamsDto),
        'facilityName': submissionEmailParamsDto.facilityName || 'NA',
        'configuration': submissionSet.configuration,
        'orisCode': submissionEmailParamsDto.orisCode || 'NA',
        'stateCode': submissionEmailParamsDto.stateCode || 'NA',
        'unitStackPipe': submissionEmailParamsDto.unitStackPipe || 'NA',
        'submissionDateDisplay': await this.getDisplayDate(submissionSet.submittedOn),
      },
    };

    submissionEmailParamsDto.templateContext['isCritical1Error'] = isCritical1Severity(submissionEmailParamsDto.highestSeverityRecord);

    //Set the contact us email
    const supportEmailRecord = await this.returnManager().findOneBy(ClientConfig, {
      name: 'ecmps-ui',
    });
    submissionEmailParamsDto.templateContext['supportEmail'] = supportEmailRecord.supportEmail?.trim() ?? '';
    submissionEmailParamsDto.templateContext['cdxUrl'] = this.configService.get<string>('app.cdxUrl')?.trim() ?? '';

    //Set to and cc emails
    submissionEmailParamsDto.templateContext['toEmail'] = toEmail;
    submissionEmailParamsDto.templateContext['ccEmail'] = ccEmail;
  }

  async getSubmissionType(submissionEmailParamsDto : SubmissionEmailParamsDto) {
    const submissionTypeNames = {
      'MP': 'Monitoring Plan',
      'QA': 'QA Test',
      'EM': 'Emissions',
      'MATS': 'MATS',
    };

    return submissionTypeNames[submissionEmailParamsDto.processCode];
  }

  private async getEmailSubject(submissionEmailParamsDto : SubmissionEmailParamsDto): Promise<string> {

    const highestSeveritySubmissionQueueRecord = submissionEmailParamsDto?.highestSeverityRecord?.submissionQueue;
    const fileTypeAbbrev = highestSeveritySubmissionQueueRecord?.processCode;
    const orisCode = submissionEmailParamsDto.submissionSet.orisCode;
    const unitStackPipe = submissionEmailParamsDto.templateContext['monitorPlan'].item.unitStackPipe;
    const severityLevelDescription = submissionEmailParamsDto?.highestSeverityRecord?.severityCode?.severityCodeDescription;

    return `${fileTypeAbbrev} Feedback for ORIS Code ${orisCode} ${unitStackPipe} (${severityLevelDescription})`;
  }

  async getDisplayDate (date : Date): Promise<string>   {
    return date.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  }

  async getEmissionsSummaryReport (submissionEmailParamsDto : SubmissionEmailParamsDto): Promise<string>   {
    const submissionSet = submissionEmailParamsDto.submissionSet;
    const emSubmissionRecords = submissionEmailParamsDto.submissionRecords;

    let reportParams = new ReportParamsDTO();
    reportParams.monitorPlanId = submissionSet.monPlanIdentifier;
    //reportParams.reportingPeriodIds = emSubmissionRecords.map((esr) => esr.rptPeriodIdentifier);
    reportParams.reportingPeriodIds = emSubmissionRecords.map((esr) => esr.rptPeriodIdentifier).join(',');
    reportParams.reportCode = 'EM_QRT_SUM';
    const monLocationIds = submissionEmailParamsDto.monLocationIds.split(',').map(item => item.trim());
    const promises = [];

    //Loop through the location IDs and get the data
    for (const monLocationId of monLocationIds) {
      reportParams.locationId = monLocationId;
      const promise = this.dataSetService.getDataSet(reportParams).then(report => {
        return this.submissionFeedbackRecordService.generateSummaryTableForUnitStack(report, reportParams.locationId);
      });

      promises.push(promise);
    }

    const results = await Promise.all(promises);
    return results.join('<br><br>'); //Aggregate the results
  }

  async findRecordWithHighestSeverityLevel(submissionQueueRecords: SubmissionQueue [], severityCodes: SeverityCode[]): Promise<HighestSeverityRecord> {
    // Create a mapping of severityCode to severity_level
    const severityCodeMap = new Map<string, SeverityCode>();
    severityCodes.forEach((severityCode) => {
      severityCodeMap.set(severityCode.severityCode, severityCode);
    });

    // Find the record with the maximum severity_level
    let highestSeverityRecord : HighestSeverityRecord;
    let maxSeverityLevel = -Infinity;

    submissionQueueRecords.forEach((record) => {
      const severityCode = severityCodeMap.get(record.severityCode);
      if (severityCode !== undefined && severityCode.severityLevel > maxSeverityLevel) {
        maxSeverityLevel = severityCode.severityLevel;
        highestSeverityRecord = {submissionQueue: record, severityCode: severityCode};
      }
    });

    if (highestSeverityRecord) {
      return highestSeverityRecord;
    } else { // No records found for some reason, return the first available one or return null.
      return {
        submissionQueue: submissionQueueRecords.length > 0 ? submissionQueueRecords[0] : null,
        severityCode: submissionQueueRecords.length > 0 ? severityCodeMap.get(submissionQueueRecords[0].severityCode) || null : null,
      };
    }
  }

  extractBodyContent(html: string): string {
    if (!html) {
      return '';
    }

    // Use a regular expression to extract content between <body> tags
    const bodyContentMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

    // Return the content if found, otherwise return an empty string
    return bodyContentMatch ? bodyContentMatch[1].trim() : '';
  }
}
