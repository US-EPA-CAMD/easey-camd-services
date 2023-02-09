import { getManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { EvaluationDTO } from '../dto/evaluation.dto';
import { v4 as uuidv4 } from 'uuid';
import { EvaluationSet } from '../entities/evaluation-set.entity';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { Plant } from '../entities/plant.entity';
import { Evaluation } from '../entities/evaluation.entity';
import { TestSummary } from 'src/entities/test-summary.entity';
import { QaCertEvent } from 'src/entities/qa-cert-event.entity';
import { QaTee } from 'src/entities/qa-tee.entity';
import { ReportingPeriod } from 'src/entities/reporting-period.entity';
import { EmissionEvaluation } from 'src/entities/emission-evaluation.entity';

@Injectable()
export class EvaluationService {
  constructor(private readonly logger: Logger) {}

  returnManager(): any {
    return getManager();
  }

  async queueEvaluationRecords(params: EvaluationDTO): Promise<void> {
    let promises = [];

    for (const item of params.items) {
      promises.push(
        new Promise(async (resolve) => {
          try {
            const currentTime = new Date();
            const set_id = uuidv4();

            const evaluationSet = new EvaluationSet();
            evaluationSet.evaluationSetIdentifier = set_id;
            evaluationSet.monPlanIdentifier = item.monPlanId;
            evaluationSet.userIdentifier = params.userId;
            evaluationSet.userEmail = params.userEmail;
            evaluationSet.submittedOn = currentTime;

            const locationAttributes = (
              await getManager().query(
                `SELECT ml.mon_loc_id, u.unit_id, u.unitid, sp.stack_pipe_id, sp.stack_name
                  FROM camdecmpswks.monitor_location ml
                  JOIN camdecmpswks.monitor_plan_location USING(mon_loc_id)
                  LEFT JOIN camd.unit u ON ml.unit_id = u.unit_id
                  LEFT JOIN camdecmpswks.stack_pipe sp ON ml.stack_pipe_id = sp.stack_pipe_id
                    WHERE mon_plan_id = $1
                    ORDER BY unitId, stack_name`,
                [item.monPlanId],
              )
            )[0];

            if (
              locationAttributes['unitid'] !== null &&
              locationAttributes['unitid'] !== ''
            ) {
              evaluationSet.configuration = locationAttributes['unitid'];
            } else {
              evaluationSet.configuration = locationAttributes['stack_name'];
            }

            const mp: MonitorPlan = await getManager().findOne(
              MonitorPlan,
              item.monPlanId,
            );

            const facility: Plant = await getManager().findOne(
              Plant,
              mp.facIdentifier,
            );

            evaluationSet.facIdentifier = facility.orisCode;
            evaluationSet.facName = facility.facilityName;

            await getManager().insert(EvaluationSet, evaluationSet);

            if (item.submitMonPlan === true) {
              //Create monitor plan queue record
              mp.evalStatusCode = 'INQ';

              const mpRecord = new Evaluation();
              mpRecord.evaluationSetIdentifier = set_id;
              mpRecord.processCode = 'MP';
              mpRecord.statusCode = 'QUEUED';
              mpRecord.submittedOn = currentTime;

              await getManager().insert(Evaluation, mpRecord);
              await getManager().update(MonitorPlan, mp, mp);
            }

            for (const id of item.testSumIds) {
              const ts = await getManager().findOne(TestSummary, id);
              ts.evalStatusCode = 'INQ';

              const tsRecord = new Evaluation();
              tsRecord.evaluationSetIdentifier = set_id;
              tsRecord.processCode = 'QA';

              if (item.submitMonPlan === false) {
                tsRecord.statusCode = 'QUEUED';
              } else {
                tsRecord.statusCode = 'PENDING';
              }

              tsRecord.testSumIdentifier = id;
              tsRecord.submittedOn = currentTime;

              await getManager().update(TestSummary, ts, ts);
              await getManager().insert(Evaluation, tsRecord);
            }

            for (const id of item.qceIds) {
              const qce = await getManager().findOne(QaCertEvent, id);
              qce.evalStatusCode = 'INQ';

              const qceRecord = new Evaluation();
              qceRecord.evaluationSetIdentifier = set_id;
              qceRecord.processCode = 'QA';

              if (item.submitMonPlan === false) {
                qceRecord.statusCode = 'QUEUED';
              } else {
                qceRecord.statusCode = 'PENDING';
              }

              qceRecord.qaCertEventIdentifier = id;
              qceRecord.submittedOn = currentTime;

              await getManager().update(QaCertEvent, qce, qce);
              await getManager().insert(Evaluation, qceRecord);
            }

            for (const id of item.teeIds) {
              const tee = await getManager().findOne(QaTee, id);
              tee.evalStatusCode = 'INQ';

              const teeRecord = new Evaluation();
              teeRecord.evaluationSetIdentifier = set_id;
              teeRecord.processCode = 'QA';

              if (item.submitMonPlan === false) {
                teeRecord.statusCode = 'QUEUED';
              } else {
                teeRecord.statusCode = 'PENDING';
              }

              teeRecord.testExtensionExemptionIdentifier = id;
              teeRecord.submittedOn = currentTime;

              await getManager().update(QaTee, tee, tee);
              await getManager().insert(Evaluation, teeRecord);
            }

            for (const periodAbr of item.emissionsReportingPeriods) {
              const rp = await getManager().findOne(ReportingPeriod, {
                where: { periodAbbreviation: periodAbr },
              });

              const ee = await getManager().findOne(EmissionEvaluation, {
                where: {
                  monPlanIdentifier: item.monPlanId,
                  rptPeriodIdentifier: rp.rptPeriodIdentifier,
                },
              });

              ee.evalStatusCode = 'INQ';

              const emissionRecord = new Evaluation();
              emissionRecord.evaluationSetIdentifier = set_id;
              emissionRecord.processCode = 'EM';

              if (
                item.submitMonPlan === false &&
                item.testSumIds.length === 0 &&
                item.qceIds.length === 0 &&
                item.teeIds.length === 0
              ) {
                emissionRecord.statusCode = 'QUEUED';
              } else {
                emissionRecord.statusCode = 'PENDING';
              }
              emissionRecord.rptPeriodIdentifier = rp.rptPeriodIdentifier;
              emissionRecord.submittedOn = currentTime;

              await getManager().update(EmissionEvaluation, ee, ee);
              await getManager().insert(Evaluation, emissionRecord);
            }

            resolve(true);
          } catch (e) {
            console.log(e);
            this.logger.info('Failed record queueing', {
              monPlanId: item.monPlanId,
            });
            resolve(false);
          }
        }),
      );
    }

    await Promise.all(promises);
  }
}
