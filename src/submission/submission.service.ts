import { Injectable } from '@nestjs/common';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { EntityManager, MoreThanOrEqual } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { EvaluationItem } from '../dto/evaluation.dto';
import { SubmissionsLastUpdatedResponseDTO } from '../dto/submission-last-updated.dto';
import { SubmissionQueueDTO } from '../dto/submission-queue.dto';
import { CheckSession } from '../entities/check-session.entity';
import { CombinedSubmissions } from '../entities/combined-submissions.entity';
import { EmissionEvaluationGlobal } from '../entities/emission-evaluation-global.entity';
import { EmissionEvaluation } from '../entities/emission-evaluation.entity';
import { MatsBulkFile } from '../entities/mats-bulk-file.entity';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { Plant } from '../entities/plant.entity';
import { QaCertEvent } from '../entities/qa-cert-event.entity';
import { QaSuppData } from '../entities/qa-supp.entity';
import { QaTee } from '../entities/qa-tee.entity';
import { ReportingPeriod } from '../entities/reporting-period.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import { SubmissionSet } from '../entities/submission-set.entity';
import { CombinedSubmissionsMap } from '../maps/combined-submissions.map';
import { EmissionsLastUpdatedMap } from '../maps/emissions-last-updated.map';

@Injectable()
export class SubmissionService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly logger: Logger,
    private readonly combinedSubmissionMap: CombinedSubmissionsMap,
    private readonly emissionsLastUpdatedMap: EmissionsLastUpdatedMap,
  ) {}

  returnManager() {
    return this.entityManager;
  }

  private async queueRecord(
    userId: string,
    userEmail: string,
    activityId: string,
    hasCritErrors: boolean,
    item: EvaluationItem,
  ): Promise<void> {
    try {
      const currentTime = new Date();
      const setId = uuidv4();

      this.logger.log(
        `Queueing record. setId: ${setId}, MonPlanId: ${item?.monPlanId || 'N/A'}, UserId: ${userId || 'N/A'}`,
      );

      const submissionSet = new SubmissionSet();
      submissionSet.hasCritErrors = hasCritErrors;
      submissionSet.activityId = activityId;
      submissionSet.submissionSetIdentifier = setId;
      submissionSet.monPlanIdentifier = item.monPlanId;
      submissionSet.userIdentifier = userId;
      submissionSet.userEmail = userEmail;
      submissionSet.submittedOn = currentTime;
      submissionSet.statusCode = 'QUEUED';

      const locations = await this.returnManager().query(
        `SELECT camdecmpsaux.get_mp_location_list($1);`,
        [item.monPlanId],
      );

      submissionSet.configuration = locations[0]['get_mp_location_list'];

      const mp: MonitorPlan = await this.returnManager().findOneBy(
        MonitorPlan,
        { monPlanIdentifier: item.monPlanId },
      );

      const facility: Plant = await this.returnManager().findOneBy(Plant, {
        facIdentifier: mp.facIdentifier,
      });

      submissionSet.facIdentifier = facility.facIdentifier;
      submissionSet.orisCode = facility.orisCode;
      submissionSet.facName = facility.facilityName;

      await this.returnManager().save(SubmissionSet, submissionSet);

      if (item.submitMonPlan === true) {
        this.logger.log(`Creating a monitoring plan record. setId: ${setId}, MonPlanId: ${item?.monPlanId || 'N/A'}`,);
        //Create monitor plan queue record
        mp.submissionAvailabilityCode = 'PENDING';

        const mpRecord = new SubmissionQueue();
        mpRecord.submissionSetIdentifier = setId;
        mpRecord.processCode = 'MP';
        mpRecord.statusCode = 'QUEUED';
        mpRecord.submittedOn = currentTime;

        const cs: CheckSession = await this.returnManager()
          .createQueryBuilder(CheckSession, 'cs')
          .where('cs.monPlanId = :monPlanId', { monPlanId: item.monPlanId })
          .andWhere('cs.processCode = :processCode', { processCode: 'MP' })
          .andWhere('cs.tesSumId IS NULL')
          .andWhere('cs.qaCertEventId IS NULL')
          .andWhere('cs.testExtensionExemptionId IS NULL')
          .andWhere('cs.rptPeriodId IS NULL')
          .getOne();

        this.logger.log(`Retrieved severity code of ${cs?.severityCode} from CheckSession`,);
        mpRecord.severityCode = cs?.severityCode || 'NONE';

        await this.returnManager().save(mpRecord);
        await this.returnManager().save(mp);
      }

      this.logger.log(`Queueing ${item?.testSumIds?.length} test summary records.`,);
      for (const id of item.testSumIds) {
        const ts: QaSuppData = await this.returnManager().findOneBy(
          QaSuppData,
          {
            testSumId: id,
          },
        );

        this.logger.log(`Queueing test summary with ID ${id} ...`,);
        const tsRecord = new SubmissionQueue();
        tsRecord.submissionSetIdentifier = setId;
        tsRecord.processCode = 'QA';
        tsRecord.statusCode = 'QUEUED';
        tsRecord.testSumIdentifier = id;
        tsRecord.submittedOn = currentTime;

        const cs: CheckSession = await this.returnManager().findOneBy(
          CheckSession,
          {
            tesSumId: id,
          },
        );

        tsRecord.severityCode = cs?.severityCode || 'NONE';
        await this.returnManager().save(tsRecord);

        if (ts) {
          ts.submissionAvailabilityCode = 'PENDING'; //TODO FIND SUPP RECORD CORRESPONDING
          await this.returnManager().save(ts);
        }
      }

      this.logger.log(`Queueing ${item?.qceIds?.length} QCE records.`,);
      for (const id of item.qceIds) {
        const qce: QaCertEvent = await this.returnManager().findOneBy(
          QaCertEvent,
          { qaCertEventIdentifier: id },
        );

        const qceRecord = new SubmissionQueue();
        qceRecord.submissionSetIdentifier = setId;
        qceRecord.processCode = 'QA';

        qceRecord.statusCode = 'QUEUED';

        qceRecord.qaCertEventIdentifier = id;
        qceRecord.submittedOn = currentTime;

        const cs: CheckSession = await this.returnManager().findOneBy(
          CheckSession,
          {
            qaCertEventId: id,
          },
        );

        this.logger.log(`Queueing QCE with ID ${id} ...`,);
        qceRecord.severityCode = cs?.severityCode || 'NONE';
        await this.returnManager().save(qceRecord);
        if (qce) {
          qce.submissionAvailabilityCode = 'PENDING';
          await this.returnManager().save(qce);
        }
      }

      this.logger.log(`Queueing ${item?.teeIds?.length} TEE records.`,);
      for (const id of item.teeIds) {
        const tee: QaTee = await this.returnManager().findOneBy(QaTee, {
          testExtensionExemptionIdentifier: id,
        });

        this.logger.log(`Queueing TEE with ID ${id} ...`,);
        const teeRecord = new SubmissionQueue();
        teeRecord.submissionSetIdentifier = setId;
        teeRecord.processCode = 'QA';
        teeRecord.statusCode = 'QUEUED';

        teeRecord.testExtensionExemptionIdentifier = id;
        teeRecord.submittedOn = currentTime;

        const cs: CheckSession = await this.returnManager().findOneBy(
          CheckSession,
          {
            testExtensionExemptionId: id,
          },
        );

        teeRecord.severityCode = cs?.severityCode || 'NONE';
        await this.returnManager().save(teeRecord);
        if (tee) {
          tee.submissionAvailabilityCode = 'PENDING';
          await this.returnManager().save(tee);
        }
      }

      this.logger.log(`Queueing emissions with ${item?.emissionsReportingPeriods?.length} reporting period(s).`,);
      for (const periodAbr of item.emissionsReportingPeriods) {
        const rp = await this.returnManager().findOneBy(ReportingPeriod, {
          periodAbbreviation: periodAbr,
        });

        this.logger.log(`Queueing EM with ID ${rp?.rptPeriodIdentifier} and monPlanId ${item?.monPlanId} ...`,);
        const ee: EmissionEvaluation = await this.returnManager().findOneBy(
          EmissionEvaluation,
          {
            monPlanIdentifier: item.monPlanId,
            rptPeriodIdentifier: rp.rptPeriodIdentifier,
          },
        );

        const emissionRecord = new SubmissionQueue();
        emissionRecord.submissionSetIdentifier = setId;
        emissionRecord.processCode = 'EM';

        emissionRecord.statusCode = 'QUEUED';

        emissionRecord.rptPeriodIdentifier = rp.rptPeriodIdentifier;
        emissionRecord.submittedOn = currentTime;

        const cs: CheckSession = await this.returnManager().findOneBy(
          CheckSession,
          {
            monPlanId: item.monPlanId,
            rptPeriodId: rp.rptPeriodIdentifier,
          },
        );

        emissionRecord.severityCode = cs?.severityCode || 'NONE';

        await this.returnManager().save(emissionRecord);
        if (ee) {
          ee.submissionAvailabilityCode = 'PENDING';
          await this.returnManager().save(ee);
        }
      }

      this.logger.log(`Queueing ${item?.matsBulkFiles?.length} MATS records.`,);
      for (const matsId of item.matsBulkFiles) {
        const mf = await this.returnManager().findOneBy(MatsBulkFile, {
          id: matsId,
        });

        this.logger.log(`Queueing MATS with ID ${matsId} ...`,);
        const matsRecord = new SubmissionQueue();
        matsRecord.submissionSetIdentifier = setId;
        matsRecord.processCode = 'MATS';

        matsRecord.statusCode = 'QUEUED';

        matsRecord.matsBulkFileId = matsId;
        matsRecord.submittedOn = currentTime;

        matsRecord.severityCode = 'NONE';


        await this.returnManager().save(matsRecord);
        if (mf) {
          mf.submissionAvailabilityCode = 'PENDING';
          await this.returnManager().save(mf);
        }
      }

      this.logger.log(`Successfully queued record. SetId: ${setId}, MonPlanId: ${item?.monPlanId || 'N/A'}`,);

    } catch (e) {
      this.logger.error(`Failed to queue record. MonPlanId: ${item?.monPlanId || 'N/A'}, Error: ${e.message}`,e.stack,);
    }
  }

  async queueSubmissionRecords(params: SubmissionQueueDTO): Promise<void> {
    this.logger.log(
      `Starting to queue submission records. UserId: ${params?.userId || 'N/A'}, activityId: ${params?.activityId || 'N/A'},  Items count: ${params?.items?.length || 0}`,
    );

    let promises = [];

    for (const item of params.items) {
      promises.push(
        this.queueRecord(
          params.userId,
          params.userEmail,
          params.activityId,
          params.hasCritErrors,
          item,
        ),
      );
    }

    await Promise.all(promises);
    this.logger.log(`Finished queueing submission records for UserId: ${params?.userId || 'N/A'}`,);
  }

  async getLastUpdated(
    queryTime: string,
  ): Promise<SubmissionsLastUpdatedResponseDTO> {
    const dto = new SubmissionsLastUpdatedResponseDTO();

    const clock: Date = (await this.entityManager.query('SELECT now();'))[0]
      .now;

    dto.submissionLogs = await this.combinedSubmissionMap.many(
      await this.entityManager.findBy(CombinedSubmissions, {
        submissionEndStateStageTime: MoreThanOrEqual(new Date(queryTime)),
        statusCode: 'COMPLETE',
        processCode: 'EM',
      }),
    );

    dto.emissionReports = await this.emissionsLastUpdatedMap.many(
      await this.entityManager.findBy(EmissionEvaluationGlobal, {
        lastUpdated: MoreThanOrEqual(new Date(queryTime).toISOString()),
      }),
    );

    dto.mostRecentUpdateDate = clock;

    return dto;
  }
}
