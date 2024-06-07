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

  async queueRecord(
    userId: string,
    userEmail: string,
    activityId: string,
    hasCritErrors: boolean,
    item: EvaluationItem,
  ): Promise<void> {
    try {
      const currentTime = new Date();
      const set_id = uuidv4();

      const submissionSet = new SubmissionSet();
      submissionSet.hasCritErrors = hasCritErrors;
      submissionSet.activityId = activityId;
      submissionSet.submissionSetIdentifier = set_id;
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
        //Create monitor plan queue record
        mp.submissionAvailabilityCode = 'PENDING';

        const mpRecord = new SubmissionQueue();
        mpRecord.submissionSetIdentifier = set_id;
        mpRecord.processCode = 'MP';
        mpRecord.statusCode = 'QUEUED';
        mpRecord.submittedOn = currentTime;

        const cs: CheckSession = await this.returnManager().findOneBy(
          CheckSession,
          {
            monPlanId: item.monPlanId,
            tesSumId: null,
            qaCertEventId: null,
            testExtensionExemptionId: null,
            rptPeriodId: null,
          },
        );

        mpRecord.severityCode = cs?.severityCode || 'NONE';

        await this.returnManager().save(mpRecord);
        await this.returnManager().save(mp);
      }

      for (const id of item.testSumIds) {
        const ts: QaSuppData = await this.returnManager().findOneBy(
          QaSuppData,
          {
            testSumId: id,
          },
        );
        ts.submissionAvailabilityCode = 'PENDING'; //TODO FIND SUPP RECORD CORRESPONDING

        const tsRecord = new SubmissionQueue();
        tsRecord.submissionSetIdentifier = set_id;
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

        await this.returnManager().save(ts);
        await this.returnManager().save(tsRecord);
      }

      for (const id of item.qceIds) {
        const qce: QaCertEvent = await this.returnManager().findOneBy(
          QaCertEvent,
          { qaCertEventIdentifier: id },
        );
        qce.submissionAvailabilityCode = 'PENDING';

        const qceRecord = new SubmissionQueue();
        qceRecord.submissionSetIdentifier = set_id;
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

        qceRecord.severityCode = cs?.severityCode || 'NONE';

        await this.returnManager().save(qce);
        await this.returnManager().save(qceRecord);
      }

      for (const id of item.teeIds) {
        const tee: QaTee = await this.returnManager().findOneBy(QaTee, {
          testExtensionExemptionIdentifier: id,
        });
        tee.submissionAvailabilityCode = 'PENDING';

        const teeRecord = new SubmissionQueue();
        teeRecord.submissionSetIdentifier = set_id;
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

        await this.returnManager().save(tee);
        await this.returnManager().save(teeRecord);
      }

      for (const periodAbr of item.emissionsReportingPeriods) {
        const rp = await this.returnManager().findOneBy(ReportingPeriod, {
          periodAbbreviation: periodAbr,
        });

        const ee: EmissionEvaluation = await this.returnManager().findOneBy(
          EmissionEvaluation,
          {
            monPlanIdentifier: item.monPlanId,
            rptPeriodIdentifier: rp.rptPeriodIdentifier,
          },
        );

        ee.submissionAvailabilityCode = 'PENDING';

        const emissionRecord = new SubmissionQueue();
        emissionRecord.submissionSetIdentifier = set_id;
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

        await this.returnManager().save(ee);
        await this.returnManager().save(emissionRecord);
      }

      for (const matsId of item.matsBulkFiles) {
        const mf = await this.returnManager().findOneBy(MatsBulkFile, {
          id: matsId,
        });

        mf.submissionAvailabilityCode = 'PENDING';

        const matsRecord = new SubmissionQueue();
        matsRecord.submissionSetIdentifier = set_id;
        matsRecord.processCode = 'MATS';

        matsRecord.statusCode = 'QUEUED';

        matsRecord.matsBulkFileId = matsId;
        matsRecord.submittedOn = currentTime;

        matsRecord.severityCode = 'NONE';

        await this.returnManager().save(mf);
        await this.returnManager().save(matsRecord);
      }
    } catch (e) {
      console.log(e);
      this.logger.log('Failed record queueing', {
        monPlanId: item.monPlanId,
      });
    }
  }

  async queueSubmissionRecords(params: SubmissionQueueDTO): Promise<void> {
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
