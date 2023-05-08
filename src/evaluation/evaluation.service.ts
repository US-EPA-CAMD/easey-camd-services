import { getManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { EvaluationDTO } from '../dto/evaluation.dto';
import { v4 as uuidv4 } from 'uuid';
import { EvaluationSet } from '../entities/evaluation-set.entity';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { Plant } from '../entities/plant.entity';
import { Evaluation } from '../entities/evaluation.entity';
import { TestSummary } from '../entities/test-summary.entity';
import { QaCertEvent } from '../entities/qa-cert-event.entity';
import { QaTee } from '../entities/qa-tee.entity';
import { ReportingPeriod } from '../entities/reporting-period.entity';
import { EmissionEvaluation } from '../entities/emission-evaluation.entity';

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

            const locationAttributes = await this.returnManager().query(
              `SELECT ml.mon_loc_id, u.unit_id, u.unitid, sp.stack_pipe_id, sp.stack_name
                  FROM camdecmpswks.monitor_location ml
                  JOIN camdecmpswks.monitor_plan_location USING(mon_loc_id)
                  LEFT JOIN camd.unit u ON ml.unit_id = u.unit_id
                  LEFT JOIN camdecmpswks.stack_pipe sp ON ml.stack_pipe_id = sp.stack_pipe_id
                    WHERE mon_plan_id = $1
                    ORDER BY unitId, stack_name`,
              [item.monPlanId],
            );

            const locationParts = [];
            for (const loc of locationAttributes) {
              if (loc['unitid'] !== null && loc['unitid'] !== '') {
                locationParts.push(loc['unitid']);
              } else {
                locationParts.push(loc['stack_name']);
              }
            }

            evaluationSet.configuration = locationParts.join(', ');

            const mp: MonitorPlan = await this.returnManager().findOne(
              MonitorPlan,
              item.monPlanId,
            );

            const facility: Plant = await this.returnManager().findOne(
              Plant,
              mp.facIdentifier,
            );

            evaluationSet.facIdentifier = facility.orisCode;
            evaluationSet.facName = facility.facilityName;

            await this.returnManager().save(EvaluationSet, evaluationSet);

            if (item.submitMonPlan === true) {
              //Create monitor plan queue record
              mp.evalStatusCode = 'INQ';

              const mpRecord = new Evaluation();
              mpRecord.evaluationSetIdentifier = set_id;
              mpRecord.processCode = 'MP';
              mpRecord.statusCode = 'QUEUED';
              mpRecord.submittedOn = currentTime;

              await this.returnManager().save(mpRecord);
              await this.returnManager().save(mp);
            }

            for (const id of item.testSumIds) {
              const ts = await this.returnManager().findOne(TestSummary, id);
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

              await this.returnManager().save(ts);
              await this.returnManager().save(tsRecord);
            }

            for (const id of item.qceIds) {
              const qce = await this.returnManager().findOne(QaCertEvent, id);
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

              await this.returnManager().save(qce);
              await this.returnManager().save(qceRecord);
            }

            for (const id of item.teeIds) {
              const tee = await this.returnManager().findOne(QaTee, id);
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

              await this.returnManager().save(tee);
              await this.returnManager().save(teeRecord);
            }

            for (const periodAbr of item.emissionsReportingPeriods) {
              const rp = await this.returnManager().findOne(ReportingPeriod, {
                where: { periodAbbreviation: periodAbr },
              });

              const ee = await this.returnManager().findOne(
                EmissionEvaluation,
                {
                  where: {
                    monPlanIdentifier: item.monPlanId,
                    rptPeriodIdentifier: rp.rptPeriodIdentifier,
                  },
                },
              );

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

              await this.returnManager().save(ee);
              await this.returnManager().save(emissionRecord);
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
