import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { EntityManager, In, MoreThanOrEqual, Not, Repository, DataSource } from 'typeorm';
import { withSlaveConnection } from '@us-epa-camd/easey-common/connection';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';

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
import { ErrorHandlerService } from './error-handler.service';
import { SubmissionSetHelperService } from './submission-set-helper.service';
import { EvaluationSet } from '../entities/evaluation-set.entity';
import { Evaluation } from '../entities/evaluation.entity';
import { TestSummary } from '../entities/test-summary.entity';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';
import { EvalSubmissionQueueOrderParamsDTO, SubmissionQueuePlaceDTO } from '../dto/eval-submission-queue.dto';
import { SubmissionQueuePosition } from '../entities/submission_queue_position.entity';

@Injectable()
export class SubmissionService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly logger: Logger,
    private readonly combinedSubmissionMap: CombinedSubmissionsMap,
    private readonly emissionsLastUpdatedMap: EmissionsLastUpdatedMap,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly submissionSetHelper: SubmissionSetHelperService,
    private readonly dataSource: DataSource,

    @InjectRepository(SubmissionQueuePosition)
    private readonly submissionQueuePositionRepo: Repository<SubmissionQueuePosition>,
  ) { }

  private async ensureRelatedInactivePlansSubmitted(monPlanId: string) {
    const mp = await this.returnManager().findOne(MonitorPlan, {
      where: { monPlanIdentifier: monPlanId },
      relations: { locations: true },
    });
    if (!mp) {
      throw new EaseyException(
        new Error('Monitoring plan not found.'),
        HttpStatus.NOT_FOUND,
      );
    }

    const isActive = mp.endRPTPeriodIdentifier === null;

    const existsUnsubmittedInactive =
      (await this.returnManager().countBy(MonitorPlan, {
        facIdentifier: mp.facIdentifier,
        locations: {
          monLocIdentifier: In(mp.locations.map((loc) => loc.monLocIdentifier)),
        },
        monPlanIdentifier: Not(mp.monPlanIdentifier),
        submissionAvailabilityCode: Not('UPDATED'),
      })) > 0;

    if (isActive && existsUnsubmittedInactive) {
      throw new EaseyException(
        new Error(
          'Inactive monitoring plans for at least one of the locations in the current monitoring plan need to be submitted prior to submitting the current, active monitoring plan.',
        ),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  returnManager() {
    return this.entityManager;
  }
  private async validateSubmissionInput(evaluationItem: EvaluationItem, entityManager: EntityManager) {
    // General check prior to creating a Submission Set
    // Check for incomplete Submission Set records
    const incompleteSubmissionSet = await entityManager
      .createQueryBuilder(SubmissionSet, 'ss')
      .where('ss.mon_plan_id = :monPlanId', { monPlanId: evaluationItem.monPlanId })
      .andWhere('ss.completed_time IS NULL')
      .andWhere('ss.note_time IS NULL')
      .getOne();

    if (incompleteSubmissionSet) {
      throw new EaseyException(new Error(`Monitoring Plan ID ${evaluationItem.monPlanId} has submissions in progress`), HttpStatus.CONFLICT);
    }

    // Check for incomplete Evaluation Set
    const incompleteEvalSet = await entityManager
      .createQueryBuilder(EvaluationSet, 'es')
      .innerJoin(Evaluation, 'eq', 'eq.evaluation_set_id = es.evaluation_set_id')
      .where('es.mon_plan_id = :monPlanId', { monPlanId: evaluationItem.monPlanId })
      .andWhere('eq.completed_time IS NULL')
      .andWhere('eq.note_time IS NULL')
      .getOne();

    if (incompleteEvalSet) {
      throw new EaseyException(new Error(`Monitoring Plan ID ${evaluationItem.monPlanId} has evaluations in progress`), HttpStatus.CONFLICT);
    }

    // Monitoring Plan checks
    const monPlanData = await entityManager.findOneBy(MonitorPlan, { monPlanIdentifier: evaluationItem.monPlanId });
    const mpCheckSession = monPlanData.chkSessionIdentifier
      ? await entityManager.findOneBy(CheckSession, {
        id: monPlanData.chkSessionIdentifier,
        processCode: 'MP'
      })
      : null;

    if (!mpCheckSession) {
      throw new EaseyException(new Error(`Check Session record not found for Monitoring Plan ID: ${evaluationItem.monPlanId}`), HttpStatus.NOT_FOUND);
    }
    if (mpCheckSession.severityCode === 'FATAL') {
      throw new EaseyException(new Error(`Monitoring Plan ID ${evaluationItem.monPlanId} encountered a FATAL error during evaluation and cannot be submitted`), HttpStatus.UNPROCESSABLE_ENTITY);
    }

    // Test Summary checks
    for (const testSumId of evaluationItem.testSumIds) {
      const testSumData = await entityManager.findOneBy(TestSummary, { testSumIdentifier: testSumId });
      const qaSuppData = await entityManager.findOneBy(QaSuppData, { testSumId });

      if (!testSumData || !qaSuppData) {
        throw new EaseyException(new Error(`QA Supplemental Data record not found for ID: ${testSumId}`), HttpStatus.NOT_FOUND);
      }

      const tsCheckSession = testSumData.chkSessionIdentifier
        ? await entityManager.findOneBy(CheckSession, {
          id: testSumData.chkSessionIdentifier,
        })
        : null;

      if (!tsCheckSession) {
        throw new EaseyException(new Error(`Check Session record not found for Test Summary ID: ${testSumId}`), HttpStatus.NOT_FOUND);
      }
      if (tsCheckSession.severityCode === 'FATAL') {
        throw new EaseyException(new Error(`Test Summary ID ${testSumId} encountered a FATAL error during evaluation and cannot be submitted`), HttpStatus.UNPROCESSABLE_ENTITY);
      }

      const incompleteSubmissionQueue = await entityManager
        .createQueryBuilder(SubmissionQueue, 'sq')
        .where('sq.test_sum_id = :testSumId', { testSumId })
        .andWhere('sq.completed_time IS NULL')
        .andWhere('sq.note_time IS NULL')
        .getOne();
      if (incompleteSubmissionQueue) {
        throw new EaseyException(new Error(`Test Summary ID ${testSumId} is already queued for submission`), HttpStatus.CONFLICT);
      }

      const incompleteEvaluationQueue = await entityManager
        .createQueryBuilder(Evaluation, 'eq')
        .where('eq.test_sum_id = :testSumId', { testSumId })
        .andWhere('eq.completed_time IS NULL')
        .andWhere('eq.note_time IS NULL')
        .getOne();
      if (incompleteEvaluationQueue) {
        throw new EaseyException(new Error(`Test Summary ID ${testSumId} is already queued for evaluation`), HttpStatus.CONFLICT);
      }
    }

    // QA Cert Event checks
    for (const qceId of evaluationItem.qceIds) {
      const qaCertEvent = await entityManager.findOneBy(QaCertEvent, { qaCertEventIdentifier: qceId });
      if (!qaCertEvent) {
        throw new EaseyException(new Error(`QA Cert Event record not found for ID: ${qceId}`), HttpStatus.NOT_FOUND);
      }

      const qceCheckSession = qaCertEvent.chkSessionIdentifier
        ? await entityManager.findOneBy(CheckSession, {
          id: qaCertEvent.chkSessionIdentifier,
        })
        : null;
      if (!qceCheckSession) {
        throw new EaseyException(new Error(`Check Session record not found for QA Cert Event ID: ${qceId}`), HttpStatus.NOT_FOUND);
      }
      if (qceCheckSession.severityCode === 'FATAL') {
        throw new EaseyException(new Error(`QA Cert Event ID ${qceId} encountered a FATAL error during evaluation and cannot be submitted`), HttpStatus.UNPROCESSABLE_ENTITY);
      }

      const incompleteSubmissionQueue = await entityManager
        .createQueryBuilder(SubmissionQueue, 'sq')
        .where('sq.qa_cert_event_id = :qceId', { qceId })
        .andWhere('sq.completed_time IS NULL')
        .andWhere('sq.note_time IS NULL')
        .getOne();
      if (incompleteSubmissionQueue) {
        throw new EaseyException(new Error(`QA Cert Event ID ${qceId} is already queued for submission`), HttpStatus.CONFLICT);
      }

      const incompleteEvaluationQueue = await entityManager
        .createQueryBuilder(Evaluation, 'eq')
        .where('eq.qa_cert_event_id = :qceId', { qceId })
        .andWhere('eq.completed_time IS NULL')
        .andWhere('eq.note_time IS NULL')
        .getOne();
      if (incompleteEvaluationQueue) {
        throw new EaseyException(new Error(`QA Cert Event ID ${qceId} is already queued for evaluation`), HttpStatus.CONFLICT);
      }
    }

    // Test Extension/Exemption checks
    for (const teeId of evaluationItem.teeIds) {
      const qaTee = await entityManager.findOneBy(QaTee, { testExtensionExemptionIdentifier: teeId });
      if (!qaTee) {
        throw new EaseyException(new Error(`Test Extension/Exemption record not found for ID: ${teeId}`), HttpStatus.NOT_FOUND);
      }

      const teeCheckSession = qaTee.chkSessionIdentifier
        ? await entityManager.findOneBy(CheckSession, {
          id: qaTee.chkSessionIdentifier,
        })
        : null;

      if (!teeCheckSession) {
        throw new EaseyException(new Error(`Check Session record not found for Test Extension/Exemption ID: ${teeId}`), HttpStatus.NOT_FOUND);
      }
      if (teeCheckSession.severityCode === 'FATAL') {
        throw new EaseyException(new Error(`Test Extension/Exemption ID ${teeId} encountered a FATAL error during evaluation and cannot be submitted`), HttpStatus.UNPROCESSABLE_ENTITY);
      }

      const incompleteSubmissionQueue = await entityManager
        .createQueryBuilder(SubmissionQueue, 'sq')
        .where('sq.test_extension_exemption_id = :teeId', { teeId })
        .andWhere('sq.completed_time IS NULL')
        .andWhere('sq.note_time IS NULL')
        .getOne();
      if (incompleteSubmissionQueue) {
        throw new EaseyException(new Error(`Test Extension/Exemption ID ${teeId} is already queued for submission`), HttpStatus.CONFLICT);
      }

      const incompleteEvaluationQueue = await entityManager
        .createQueryBuilder(Evaluation, 'eq')
        .where('eq.test_extension_exemption_id = :teeId', { teeId })
        .andWhere('eq.completed_time IS NULL')
        .andWhere('eq.note_time IS NULL')
        .getOne();
      if (incompleteEvaluationQueue) {
        throw new EaseyException(new Error(`Test Extension/Exemption ID ${teeId} is already queued for evaluation`), HttpStatus.CONFLICT);
      }
    }

    // Emissions checks
    for (const periodAbr of evaluationItem.emissionsReportingPeriods) {
      const reportingPeriod = await entityManager.findOneBy(ReportingPeriod, { periodAbbreviation: periodAbr });
      if (!reportingPeriod) {
        throw new EaseyException(new Error(`Reporting Period record not found for ID: ${periodAbr}`), HttpStatus.NOT_FOUND);
      }

      const emissionEvaluation = await entityManager.findOneBy(EmissionEvaluation, {
        monPlanIdentifier: evaluationItem.monPlanId,
        rptPeriodIdentifier: reportingPeriod.rptPeriodIdentifier,
      });
      if (!emissionEvaluation) {
        throw new EaseyException(new Error(`Emission Evaluation record not found for Monitoring Plan ID ${evaluationItem.monPlanId} and Reporting Period ${periodAbr}`), HttpStatus.NOT_FOUND);
      }

      const emCheckSession = emissionEvaluation.chkSessionIdentifier
        ? await entityManager.findOneBy(CheckSession, {
          id: emissionEvaluation.chkSessionIdentifier,
        })
        : null;

      if (!emCheckSession) {
        throw new EaseyException(new Error(`Check Session record not found for Monitoring Plan ID ${evaluationItem.monPlanId} and Reporting Period ${periodAbr}`), HttpStatus.NOT_FOUND);
      }
      if (emCheckSession.severityCode === 'FATAL') {
        throw new EaseyException(new Error(`Emissions for Monitoring Plan ID ${evaluationItem.monPlanId} and Reporting Period ${periodAbr} encountered a FATAL error during evaluation and cannot be submitted`), HttpStatus.UNPROCESSABLE_ENTITY);
      }
    }
  }

  private async queueRecord(
    userId: string,
    userEmail: string,
    activityId: string,
    evaluationItem: EvaluationItem,
    entityManager: EntityManager,
    queueingStages: { action: string; dateTime: string }[],
  ): Promise<void> {

    const submissionSet = new SubmissionSet();
    let currentSubmissionQueue: SubmissionQueue | null = null;

    try {
      const currentTime = new Date();
      const setId = uuidv4();

      this.logger.log(`Queueing record. setId: ${setId}, MonPlanId: ${evaluationItem?.monPlanId || 'N/A'}, UserId: ${userId || 'N/A'}`,);

      submissionSet.activityId = activityId;
      submissionSet.submissionSetIdentifier = setId;
      submissionSet.monPlanIdentifier = evaluationItem.monPlanId;
      submissionSet.userIdentifier = userId;
      submissionSet.userEmail = userEmail;
      submissionSet.queuedTime = currentTime;
      submissionSet.statusCode = 'QUEUED';

      //Push queueing stage here
      queueingStages.push({ action: 'SET_ID_ASSIGNED', dateTime: (await this.submissionSetHelper.getFormattedDateTime()) || 'N/A' });

      const locations = await entityManager.query(
        `SELECT camdecmpswks.get_mp_location_list($1);`,
        [evaluationItem.monPlanId],
      );

      submissionSet.configuration = locations[0]['get_mp_location_list'];

      const mp: MonitorPlan = await entityManager.findOneBy(
        MonitorPlan,
        { monPlanIdentifier: evaluationItem.monPlanId },
      );

      if (!mp) {
        throw new Error(`Monitor Plan not found for monPlanId: ${evaluationItem.monPlanId}`);
      }

      const facility: Plant = await entityManager.findOneBy(Plant, {
        facIdentifier: mp.facIdentifier,
      });

      if (!facility) {
        throw new Error(`Facility not found for facIdentifier: ${mp.facIdentifier}`);
      }

      submissionSet.facIdentifier = facility.facIdentifier;
      submissionSet.orisCode = facility.orisCode;
      submissionSet.facName = facility.facilityName;

      await this.validateSubmissionInput(evaluationItem, entityManager);

      await entityManager.save(SubmissionSet, submissionSet);

      //Push queueing stage here
      queueingStages.push({ action: 'SET_SAVED', dateTime: (await this.submissionSetHelper.getFormattedDateTime()) || 'N/A' });

      if (evaluationItem.submitMonPlan === true) {
        this.logger.log(`Creating a monitoring plan record. setId: ${setId}, MonPlanId: ${evaluationItem?.monPlanId || 'N/A'}`,);
        //Create monitor plan queue record
        mp.submissionAvailabilityCode = 'PENDING';

        const mpRecord = new SubmissionQueue();
        currentSubmissionQueue = mpRecord; // Keep reference for error handling
        mpRecord.submissionSetIdentifier = setId;
        mpRecord.processCode = 'MP';
        mpRecord.statusCode = 'QUEUED';
        mpRecord.queuedTime = currentTime;

        const cs: CheckSession = await entityManager
          .createQueryBuilder(CheckSession, 'cs')
          .where('cs.monPlanId = :monPlanId', { monPlanId: evaluationItem.monPlanId })
          .andWhere('cs.processCode = :processCode', { processCode: 'MP' })
          .andWhere('cs.tesSumId IS NULL')
          .andWhere('cs.qaCertEventId IS NULL')
          .andWhere('cs.testExtensionExemptionId IS NULL')
          .andWhere('cs.rptPeriodId IS NULL')
          .getOne();

        this.logger.log(`Retrieved severity code of ${cs?.severityCode} from CheckSession`,);
        mpRecord.severityCode = cs?.severityCode || 'NONE';

        await entityManager.save(mpRecord);
        await entityManager.save(mp);

        //Push queueing stage here
        queueingStages.push({ action: 'MP_QUEUED', dateTime: (await this.submissionSetHelper.getFormattedDateTime()) || 'N/A' });
      }

      this.logger.log(`Queueing ${evaluationItem?.testSumIds?.length} test summary records.`,);
      for (const id of evaluationItem.testSumIds) {
        const ts: QaSuppData = await entityManager.findOneBy(
          QaSuppData,
          {
            testSumId: id,
          },
        );

        this.logger.log(`Queueing test summary with ID ${id} ...`,);
        const tsRecord = new SubmissionQueue();
        currentSubmissionQueue = tsRecord; // Keep reference for error handling
        tsRecord.submissionSetIdentifier = setId;
        tsRecord.processCode = 'QA';
        tsRecord.statusCode = 'QUEUED';
        tsRecord.testSumIdentifier = id;
        tsRecord.queuedTime = currentTime;

        const cs: CheckSession = await entityManager.findOneBy(
          CheckSession,
          {
            tesSumId: id,
          },
        );

        tsRecord.severityCode = cs?.severityCode || 'NONE';
        await entityManager.save(tsRecord);

        if (ts) {
          ts.submissionAvailabilityCode = 'PENDING'; //TODO FIND SUPP RECORD CORRESPONDING
          await entityManager.save(ts);
        }

        //Push queueing stage here
        queueingStages.push({ action: 'TEST_QUEUED', dateTime: (await this.submissionSetHelper.getFormattedDateTime()) || 'N/A' });
      }

      this.logger.log(`Queueing ${evaluationItem?.qceIds?.length} QCE records.`,);
      for (const id of evaluationItem.qceIds) {
        const qce: QaCertEvent = await entityManager.findOneBy(
          QaCertEvent,
          { qaCertEventIdentifier: id },
        );

        this.logger.log(`Queueing QCE with ID ${id} ...`);
        const qceRecord = new SubmissionQueue();
        currentSubmissionQueue = qceRecord; // Keep reference for error handling
        qceRecord.submissionSetIdentifier = setId;
        qceRecord.processCode = 'QA';

        qceRecord.statusCode = 'QUEUED';

        qceRecord.qaCertEventIdentifier = id;
        qceRecord.queuedTime = currentTime;

        const cs: CheckSession = await entityManager.findOneBy(
          CheckSession,
          {
            qaCertEventId: id,
          },
        );

        this.logger.log(`Queueing QCE with ID ${id} ...`,);
        qceRecord.severityCode = cs?.severityCode || 'NONE';
        await entityManager.save(qceRecord);
        if (qce) {
          qce.submissionAvailabilityCode = 'PENDING';
          await entityManager.save(qce);
        }
        //Push queueing stage here
        queueingStages.push({ action: 'QCE_QUEUED', dateTime: (await this.submissionSetHelper.getFormattedDateTime()) || 'N/A' });
      }

      this.logger.log(`Queueing ${evaluationItem?.teeIds?.length} TEE records.`,);
      for (const id of evaluationItem.teeIds) {
        const tee: QaTee = await entityManager.findOneBy(QaTee, {
          testExtensionExemptionIdentifier: id,
        });

        this.logger.log(`Queueing TEE with ID ${id} ...`,);
        const teeRecord = new SubmissionQueue();
        currentSubmissionQueue = teeRecord; // Keep reference for error handling
        teeRecord.submissionSetIdentifier = setId;
        teeRecord.processCode = 'QA';
        teeRecord.statusCode = 'QUEUED';

        teeRecord.testExtensionExemptionIdentifier = id;
        teeRecord.queuedTime = currentTime;

        const cs: CheckSession = await entityManager.findOneBy(
          CheckSession,
          {
            testExtensionExemptionId: id,
          },
        );

        teeRecord.severityCode = cs?.severityCode || 'NONE';
        await entityManager.save(teeRecord);
        if (tee) {
          tee.submissionAvailabilityCode = 'PENDING';
          await entityManager.save(tee);
        }

        //Push queueing stage here
        queueingStages.push({ action: 'TEE_QUEUED', dateTime: (await this.submissionSetHelper.getFormattedDateTime()) || 'N/A' });
      }

      this.logger.log(`Queueing emissions with ${evaluationItem?.emissionsReportingPeriods?.length} reporting period(s).`,);
      for (const periodAbr of evaluationItem.emissionsReportingPeriods) {
        const rp = await entityManager.findOneBy(ReportingPeriod, {
          periodAbbreviation: periodAbr,
        });

        this.logger.log(`Queueing EM with ID ${rp?.rptPeriodIdentifier} and monPlanId ${evaluationItem?.monPlanId} ...`,);
        const ee: EmissionEvaluation = await entityManager.findOneBy(
          EmissionEvaluation,
          {
            monPlanIdentifier: evaluationItem.monPlanId,
            rptPeriodIdentifier: rp.rptPeriodIdentifier,
          },
        );

        const emissionRecord = new SubmissionQueue();
        currentSubmissionQueue = emissionRecord; // Keep reference for error handling
        emissionRecord.submissionSetIdentifier = setId;
        emissionRecord.processCode = 'EM';

        emissionRecord.statusCode = 'QUEUED';

        emissionRecord.rptPeriodIdentifier = rp.rptPeriodIdentifier;
        emissionRecord.queuedTime = currentTime;

        const cs: CheckSession = await entityManager.findOneBy(
          CheckSession,
          {
            monPlanId: evaluationItem.monPlanId,
            rptPeriodId: rp.rptPeriodIdentifier,
          },
        );

        emissionRecord.severityCode = cs?.severityCode || 'NONE';

        await entityManager.save(emissionRecord);
        if (ee) {
          ee.submissionAvailabilityCode = 'PENDING';
          await entityManager.save(ee);
        }

        //Push queueing stage here
        queueingStages.push({ action: 'EM_QUEUED', dateTime: (await this.submissionSetHelper.getFormattedDateTime()) || 'N/A' });
      }

      this.logger.log(`Queueing ${evaluationItem?.matsBulkFiles?.length} MATS records.`,);

      if (Array.isArray(evaluationItem.matsBulkFiles)) {
        for (const matsId of evaluationItem.matsBulkFiles) {
          const mf = await entityManager.findOneBy(MatsBulkFile, {
            id: matsId,
          });

          this.logger.log(`Queueing MATS with ID ${matsId} ...`,);
          const matsRecord = new SubmissionQueue();
          currentSubmissionQueue = matsRecord; // Keep reference for error handling
          matsRecord.submissionSetIdentifier = setId;
          matsRecord.processCode = 'MATS';

          matsRecord.statusCode = 'QUEUED';

          matsRecord.matsBulkFileId = matsId;
          matsRecord.queuedTime = currentTime;

          matsRecord.severityCode = 'NONE';


          await entityManager.save(matsRecord);
          if (mf) {
            mf.submissionAvailabilityCode = 'PENDING';
            await entityManager.save(mf);
          }

          //Push queueing stage here
          queueingStages.push({ action: 'MATS_QUEUED', dateTime: (await this.submissionSetHelper.getFormattedDateTime()) || 'N/A' });
        }
      }

      // Determine if there are any critical errors based on evalStatusCode in the submission
      // Get all submission queue records for this set
      const submissionQueueRecords = await entityManager.find(SubmissionQueue, {
        where: { submissionSetIdentifier: setId },
        relations: { severityCodeRecord: true },
      });

      // Check if any record has a severity code with evalStatusCode of ERR
      submissionSet.hasCritErrors = false;

      // Iterate through each record to check its severity code's evalStatusCode
      for (const record of submissionQueueRecords) {
        if (record.severityCodeRecord?.evalStatusCode === 'ERR') {
          submissionSet.hasCritErrors = true;
          break;
        }
      }

      // Only save if there are critical errors
      if (submissionSet.hasCritErrors) {
        await entityManager.save(SubmissionSet, submissionSet);
      }

      this.logger.log(`Successfully queued record. SetId: ${setId}, MonPlanId: ${submissionSet.monPlanIdentifier || 'N/A'}, hasCritErrors: ${submissionSet.hasCritErrors}`,);

    } catch (e) {
      this.logger.error(`Failed to queue record. MonPlanId: ${evaluationItem?.monPlanId || 'N/A'}, Error: ${e.message}`, e.stack,);
      this.logger.error(`Aborting transaction`);

      // Attach submissionSet and currentSubmissionQueue to the error
      e.submissionSet = submissionSet;
      e.currentSubmissionQueue = currentSubmissionQueue;

      throw e; //throw the exception so that the transaction is aborted.
    }
  }

  async queueSubmissionRecords(submissionQueueParam: SubmissionQueueDTO): Promise<void> {
    this.logger.log(
      `Starting to queue submission records. UserId: ${submissionQueueParam?.userId || 'N/A'}, activityId: ${submissionQueueParam?.activityId || 'N/A'},  Items count: ${submissionQueueParam?.items?.length || 0}`,
    );

    // Check to make sure the items are ready to be submitted.
    await Promise.all(
      submissionQueueParam.items.map(async (item) => {
        // Inactive plans must be submitted before active plans with common locations.
        await this.ensureRelatedInactivePlansSubmitted(item.monPlanId);
      }),
    );

    // Get the current date
    const currentTime = currentDateTime();
    const normalizedCurrentTime = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());

    const checks = [];
    for (const item of submissionQueueParam.items) {
      // Check all the EM records

      // Check that each EM record is within the submission window.
      for (const period of item.emissionsReportingPeriods) {
        const checkExpiredPromise = this.entityManager.query(
          `SELECT window_expired_date, facility_name, oris_code, configuration
           FROM camdecmpswks.vw_em_submit 
           WHERE mon_plan_id = $1 AND period_abbreviation = $2
           `,
          [item.monPlanId, period],
        ).then(result => {
          if (result && result.length > 0) {
            const endDate = new Date(result[0].window_expired_date);
            const facilityName = result[0].facility_name;
            const orisCode = result[0].oris_code;
            const location = result[0].configuration;
            
            // Check if the window is expired
            if (endDate < normalizedCurrentTime) {
              throw new EaseyException(
                new Error(`Submission access has expired for ${facilityName} (${orisCode}), location ${location} with Reporting Period ${period}. The access date for this window expired after ${endDate.toLocaleDateString('en-US')}. Please contact ECMPS Support to extend the submission window.`),
                HttpStatus.BAD_REQUEST,
              );
            }
          } else {
            throw new EaseyException(
              new Error(`Submission access window not found for Monitor Plan ID: ${item.monPlanId} with Reporting Period: ${period}.`),
              HttpStatus.BAD_REQUEST,
            );
          }
        });
        checks.push(checkExpiredPromise);
      }

      // Check that all periods up to the maximum provided are included in the payload.
      if (item.emissionsReportingPeriods.length > 0) {
        const maxPeriod = item.emissionsReportingPeriods.reduce(
          (a, b) => (a > b ? a : b),
          item.emissionsReportingPeriods[0],
        );
        const checkAllIncludedPromise = this.entityManager.query(`
          SELECT EXISTS(
            SELECT 1 FROM camdecmpswks.vw_em_submit
            WHERE mon_plan_id = $1 AND period_abbreviation <= $2 AND period_abbreviation != ALL($3)
          )`,
          [item.monPlanId, maxPeriod, item.emissionsReportingPeriods]
        ).then(result => {
          const periodMissingFromPayload = result[0].exists;
          if (periodMissingFromPayload) {
            throw new EaseyException(
              new Error(`All emissions reporting periods up to and including ${maxPeriod} must be included in the submission for Monitor Plan ID: ${item.monPlanId}.`),
              HttpStatus.BAD_REQUEST,
            );
          }
        });
        checks.push(checkAllIncludedPromise);
      }
    }

    await Promise.all(checks);

    // Build submissionStages array
    const queueingStages: { action: string; dateTime: string }[] = [];
    //Push queueing stage here
    queueingStages.push({ action: 'QUEUEING_STARTED', dateTime: (await this.submissionSetHelper.getFormattedDateTime()) || 'N/A' });

    const userId = submissionQueueParam.userId;
    const userEmail = submissionQueueParam.userEmail;
    const activityId = submissionQueueParam.activityId;
    const evaluationItems = submissionQueueParam.items;

    try {
      //wrap everything in a transaction to ensure that all records are queued or none are queued
      await this.entityManager.transaction(async (transactionalEntityManager) => {
        for (const evaluationItem of evaluationItems) {
          await this.queueRecord(
            userId,
            userEmail,
            activityId,
            evaluationItem,
            transactionalEntityManager, // Pass the transactional EntityManager
            queueingStages,
          );
        }
      });

      //Push queueing stage here
      queueingStages.push({ action: 'QUEUEING_COMPLETED', dateTime: (await this.submissionSetHelper.getFormattedDateTime()) || 'N/A' });

      this.logger.log(`Finished queueing submission records for UserId: ${submissionQueueParam?.userId || 'N/A'}`,);
    } catch (error) {
      this.logger.error(`Failed to queue submission records. UserId: ${submissionQueueParam?.userId || 'N/A'}, Error: ${error.message}`, error.stack,);

      // Extract submissionSet and submissionQueue from the error
      const submissionSet = error.submissionSet;
      const currentSubmissionQueue = error.currentSubmissionQueue;

      // Call ErrorHandlerService to send failure email
      await this.errorHandlerService.handleQueueingError(
        submissionSet,
        currentSubmissionQueue,
        queueingStages,
        userEmail,
        userId,
        error,
      );
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      // Throw error to API caller
      throw new HttpException(
        {
          status: status,
          error: 'Failed to queue submission records',
          message: error.message,
        },
        status,
      );
    }
  }

  async getLastUpdated(
    queryTime: Date,
  ): Promise<SubmissionsLastUpdatedResponseDTO> {
    const dto = new SubmissionsLastUpdatedResponseDTO();

    const clock: Date = (await withSlaveConnection(this.dataSource, async (manager) => {
      return await manager.query('SELECT now();');
    }))[0].now;

    dto.submissionLogs = await this.combinedSubmissionMap.many(
      await withSlaveConnection(this.dataSource, async (manager) => {
        return await manager.findBy(CombinedSubmissions, {
          submissionEndStateStageTime: MoreThanOrEqual(new Date(queryTime)),
          statusCode: 'COMPLETE',
          processCode: 'EM',
        });
      }),
    );

    dto.emissionReports = await this.emissionsLastUpdatedMap.many(
      await withSlaveConnection(this.dataSource, async (manager) => {
        return await manager.findBy(EmissionEvaluationGlobal, {
          lastUpdated: MoreThanOrEqual(new Date(queryTime).toISOString()),
        });
      }),
    );

    dto.mostRecentUpdateDate = clock;

    return dto;
  }

  async getSubmissionQueueOrder(params: EvalSubmissionQueueOrderParamsDTO): Promise<SubmissionQueuePlaceDTO[]> {

    const { orisCodes } = params;

    return await withSlaveConnection(this.dataSource, async (manager) => {
      const repository = manager.getRepository(SubmissionQueuePosition);
      return await repository
        .createQueryBuilder('ss')
        .where('ss.oris_code = ANY(:orisCodes)', { orisCodes })
        .getMany();
    });
  }
}
