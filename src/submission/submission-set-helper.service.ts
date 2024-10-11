import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { SubmissionSet } from '../entities/submission-set.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { QaCertEvent } from '../entities/qa-cert-event.entity';
import { QaTee } from '../entities/qa-tee.entity';
import { EmissionEvaluation } from '../entities/emission-evaluation.entity';
import { MatsBulkFile } from '../entities/mats-bulk-file.entity';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { QaSuppData } from '../entities/qa-supp.entity';

@Injectable()
export class SubmissionSetHelperService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly logger: Logger,
  ) {}

  async updateSubmissionSetStatus(
    submissionSet: SubmissionSet,
    statusCode: string,
    details: string = '',
    updateEndStageTime: boolean = true,
  ): Promise<void> {
    submissionSet.statusCode = statusCode;
    if (details) {
      submissionSet.details = details;
    }
    if (updateEndStageTime) {
      submissionSet.endStageTime = currentDateTime();
    }
    await this.entityManager.save(submissionSet);
  }

  async setRecordStatusCode(
    set: SubmissionSet,
    records: SubmissionQueue[],
    statusCode: string,
    details: string,
    originRecordCode: string,
  ): Promise<void> {
    for (const record of records) {
      record.statusCode = statusCode;
      record.details = details;

      let originRecord;

      switch (record.processCode) {
        case 'MP':
          originRecord = await this.entityManager.findOne(MonitorPlan, {
            where: { monPlanIdentifier: set.monPlanIdentifier },
          });
          break;
        case 'QA':
          if (record.testSumIdentifier) {
            originRecord = await this.entityManager.findOne(QaSuppData, {
              where: { testSumId: record.testSumIdentifier },
            });
          } else if (record.qaCertEventIdentifier) {
            originRecord = await this.entityManager.findOne(QaCertEvent, {
              where: {
                qaCertEventIdentifier: record.qaCertEventIdentifier,
              },
            });
          } else {
            originRecord = await this.entityManager.findOne(QaTee, {
              where: {
                testExtensionExemptionIdentifier:
                record.testExtensionExemptionIdentifier,
              },
            });
          }
          break;
        case 'EM':
          originRecord = await this.entityManager.findOne(EmissionEvaluation, {
            where: {
              monPlanIdentifier: set.monPlanIdentifier,
              rptPeriodIdentifier: record.rptPeriodIdentifier,
            },
          });

          if (originRecordCode === 'UPDATED') {
            await this.entityManager.query(
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
          originRecord = await this.entityManager.findOne(MatsBulkFile, {
            where: { id: record.matsBulkFileId },
          });
          break;
      }

      if (originRecord) {
        originRecord.submissionIdentifier = record.submissionIdentifier;
        originRecord.submissionAvailabilityCode = originRecordCode;
        await this.entityManager.save(originRecord);
      }
      await this.entityManager.save(record);
    }
  }
}
