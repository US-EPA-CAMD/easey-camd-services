import { Injectable } from '@nestjs/common';
import { SubmissionSet } from '../entities/submission-set.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { MatsBulkFile } from '../entities/mats-bulk-file.entity';
import { EntityManager } from 'typeorm';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { createReadStream, writeFileSync } from 'fs';

@Injectable()
export class SubmissionTransactionService {
  private importS3Client: S3Client;
  private globalS3Client: S3Client;

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly entityManager: EntityManager,
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

  async buildTransactions(set: SubmissionSet, records: SubmissionQueue[], folderPath: string): Promise<any[]> {
    // Sort records by process code and, for 'EM' process code, by reporting period.
    const processCodeOrder = { 'MP': 1, 'QA': 2, 'EM': 3, 'MATS': 4 };
    records
      .sort((a, b) => processCodeOrder[a.processCode] - processCodeOrder[b.processCode])
      .sort((a, b) => {
        if (a.processCode !== 'EM' || b.processCode !== 'EM') return 0;
        if (a.reportingPeriod.calendarYear !== b.reportingPeriod.calendarYear) {
          return a.reportingPeriod.calendarYear - b.reportingPeriod.calendarYear;
        }
        return a.reportingPeriod.quarter - b.reportingPeriod.quarter;
      });

    let transactions: any[] = [];
    this.logger.log(`building transactions...`);
    for (const record of records) {
      // Do not update records with critical errors.
      if (record.severityCodeRecord.evalStatusCode === 'ERR') continue;

      switch (record.processCode) {
        case 'MP':
          transactions.push({
            command: 'CALL camdecmps.copy_monitor_plan_from_workspace_to_global($1)',
            params: [set.monPlanIdentifier],
          });
          break;
        case 'QA':
          if (record.testSumIdentifier) {
            await this.removeExistingProtocolGasByTestSumId(record.testSumIdentifier)
            transactions.push({
              command: 'CALL camdecmps.copy_qa_test_summary_from_workspace_to_global($1)',
              params: [record.testSumIdentifier],
            });
          } else if (record.qaCertEventIdentifier) {
            transactions.push({
              command: 'CALL camdecmps.copy_qa_qce_data_from_workspace_to_global($1)',
              params: [record.qaCertEventIdentifier],
            });
          } else {
            transactions.push({
              command: 'CALL camdecmps.copy_qa_tee_data_from_workspace_to_global($1)',
              params: [record.testExtensionExemptionIdentifier],
            });
          }
          break;
        case 'EM':
          transactions.push({
            command: 'CALL camdecmps.copy_emissions_from_workspace_to_global($1, $2)',
            params: [set.monPlanIdentifier, record.rptPeriodIdentifier],
          });
          break;
        case 'MATS':
          await this.processMatsRecord(set, record, folderPath);
          break;
      }
    }

    return transactions;
  }

  // Delete Existing Protocol Gas Record By test_sum_id; Avoid Duplicate Protocol Gas Records #6635
  private async removeExistingProtocolGasByTestSumId(testSumIdentifier:string) {
    await this.entityManager.query(
      `DELETE FROM camdecmps.protocol_gas WHERE test_sum_id = $1`,
      [testSumIdentifier],
    );
  }

 private async processMatsRecord(set: SubmissionSet, record: SubmissionQueue, folderPath: string) {
    const matsRecord = await this.entityManager.findOne(MatsBulkFile, {
      where: { id: record.matsBulkFileId },
    });

    const getObjectResponse = await this.importS3Client.send(
      new GetObjectCommand({
        Bucket: this.configService.get<string>('matsConfig.importBucket'),
        Key: matsRecord.bucketLocation,
      }),
    );

    //Read file content as a byte-array instead of as a string.
   // This correctly processes binary and non-binary files.
    const filePath = `${folderPath}/MATS_${set.monPlanIdentifier}_${matsRecord.testTypeGroup}_${matsRecord.testNumber}_${matsRecord.fileName}`;
    const bodyContents = await getObjectResponse.Body.transformToByteArray();
    writeFileSync(filePath, Buffer.from(bodyContents));

    //Upload the Mats Bulk File Object to the global bucket
    await this.globalS3Client.send(
      new PutObjectCommand({
        Body: createReadStream(filePath),
        Key: matsRecord.bucketLocation,
        Bucket: this.configService.get<string>('matsConfig.globalBucket'),
      }),
    );
  }
}
