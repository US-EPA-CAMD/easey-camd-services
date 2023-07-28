import { Injectable } from '@nestjs/common';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { DataSetService } from '../dataset/dataset.service';
import { getManager } from 'typeorm';
import { SubmissionSet } from '../entities/submission-set.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import { CopyOfRecordService } from '../copy-of-record/copy-of-record.service';
import { ReportParamsDTO } from '../dto/report-params.dto';
import { writeFile } from 'fs';

@Injectable()
export class SubmissionProcessService {
  constructor(
    private readonly logger: Logger,
    private dataSetService: DataSetService,
    private copyOfRecordService: CopyOfRecordService,
  ) {}

  async getCopyOfRecord(
    set: SubmissionSet,
    record: SubmissionQueue,
    documents: string[],
  ): Promise<void> {
    const params = new ReportParamsDTO();
    params.facilityId = set.facIdentifier;

    switch (record.processCode) {
      case 'MP':
        params.reportCode = 'MPP';
        params.monitorPlanId = set.monPlanIdentifier;
        break;
      case 'QA':
        if (record.testSumIdentifier) {
          params.reportCode = 'TEST_DETAIL';
          params.testId = [record.testSumIdentifier];
        } else if (record.qaCertEventIdentifier) {
          params.reportCode = 'QCE';
          params.qceId = record.qaCertEventIdentifier;
        } else {
          params.reportCode = 'TEE';
          params.teeId = record.testExtensionExemptionIdentifier;
        }
        break;
      case 'EM':
        break; //TODO: Implement Emissions Report
    }

    const reportInformation = await this.dataSetService.getDataSet(
      params,
      true,
    );

    documents.push(
      this.copyOfRecordService.generateCopyOfRecord(reportInformation),
    );
  }

  async processSubmissionSet(id: string): Promise<void> {
    this.logger.log(`Processing copy of record for: ${id}`);
    // Obtain the database records for the SubmissionSet and SubmissionQueue records under that set
    const set = await getManager().findOne(SubmissionSet, id);
    const submissionSetRecords = await getManager().find(SubmissionQueue, {
      where: { submissionSetIdentifier: id },
    });

    // Iterate each record in the submission queue linked to the set and create a promise that resolves with the addition of document html string in the documents array
    const promises = [];
    const documents = [];
    for (const submissionRecord of submissionSetRecords) {
      promises.push(this.getCopyOfRecord(set, submissionRecord, documents));
    }
    await Promise.all(promises);

    //Write the document strings to html files [prepare to zip and send]
    let idx = 1;
    for (const doc of documents) {
      writeFile(`src/html-files/${idx}.html`, doc, (err) => {
        console.log(err);
      });
      idx++;
    }

    // Initiate the sign service process
  }
}
