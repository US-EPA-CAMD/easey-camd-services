import { Injectable } from '@nestjs/common';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { getManager } from 'typeorm';
import { SubmissionItem } from '../dto/submission.dto';
import { CheckSession } from '../entities/check-session.entity';
import { Submission } from '../entities/submission.entity';
import { TestSummary } from '../entities/test-summary.entity';
import { QaSuppData } from '../entities/qa-supp.entity';
import { QaCertEvent } from '../entities/qa-cert-event.entity';
import { QaTEE } from '../entities/qa-tee.entity';
import { EmissionEvaluation } from '../entities/emissions-evaluation.entity';
import { ReportingPeriod } from '../entities/reporting-period.entity';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces/current-user.interface';

@Injectable()
export class SubmissionBuilder {
  returnManager() {
    return getManager();
  }

  // Pass in a generic class and type and let the dynamic submission creator do the work for the pieces of the creation that are class dependent
  async createDynamicSubmissionRecord<A>(
    c: new () => A, // The class to submit
    setId,
    userId,
    facId,
    item,
    type,
    periodAbr?,
    qaId?, // The qa id [test_sum_id, qce_id, etc.]
    qaIdDescriptor?, //The descriptor of the qa information [i.e. the name of the entity property of the qaId]
  ) {
    return new Promise(async (resolve) => {
      try {
        let recordFindCondition;
        let rptPeriod;

        if (periodAbr) {
          rptPeriod = (
            await this.returnManager().findOne(ReportingPeriod, {
              where: { periodAbbreviation: periodAbr },
            })
          )?.rptPeriodIdentifier;
        }

        switch (type) {
          case 'MP':
            recordFindCondition = { where: { id: item.monPlanId } };
            break;
          case 'QA':
            recordFindCondition = { where: { id: qaId } };
            break;
          default:
            recordFindCondition = {
              where: { monPlanId: item.monPlanId, rptPeriodId: rptPeriod },
            };
        }

        const record = await this.returnManager().findOne(
          c,
          recordFindCondition,
        );

        if (qaIdDescriptor && qaIdDescriptor === 'testSumId') {
          //testSumId uses qa_supp_data for its availability code
          const suppRecord = await this.returnManager().findOne(QaSuppData, {
            where: { testSumId: qaId },
          });
          suppRecord.submissionAvailabilityCode = 'PENDING';
          await this.returnManager().save(suppRecord);
        } else {
          record.submissionAvailabilityCode = 'PENDING';
          await this.returnManager().save(record);
        }

        const submission = new Submission();
        if (rptPeriod) {
          submission.rptPeriodId = rptPeriod;
        }
        submission.addDate = new Date();
        submission.updateDate = new Date();
        submission.facId = facId;
        submission.monPlanId = item.monPlanId;
        submission.submissionSetId = setId;
        submission.userId = userId;
        const severityCode = (
          await this.returnManager().findOne(
            CheckSession,
            record.checkSessionId,
          )
        ).severityCode;
        submission.severityCode = severityCode;
        submission.submissionStatusCode = 'QUEUED';
        submission.submissionTypeCode = type;

        if (qaId) {
          submission[qaIdDescriptor] = qaId;
        }

        await this.returnManager().insert(Submission, submission); // Insert submission record
        resolve(true);
      } catch (e) {
        console.log(e);
        resolve(e.message);
      }
    });
  }

  hasPermissions(user: CurrentUser, orisCode: number, type: string) {
    if (user.isAdmin) {
      return true;
    }

    const permissionSet = user.permissionSet.find((p) => p.id === orisCode);

    if (permissionSet && permissionSet.permissions.includes(`DS${type}`)) {
      return true;
    }

    return false;
  }

  handleMpSubmission(
    setId: number,
    user: CurrentUser,
    facId: number,
    orisCode: number,
    item: SubmissionItem,
  ) {
    const promises = [];

    if (item.submitMonPlan) {
      if (this.hasPermissions(user, orisCode, 'MP')) {
        promises.push(
          this.createDynamicSubmissionRecord(
            MonitorPlan,
            setId,
            user.userId,
            facId,
            item,
            'MP',
          ),
        );
      }
    }

    return promises;
  }

  handleQASubmission(
    setId: number,
    user: CurrentUser,
    facId: number,
    orisCode: number,
    item: SubmissionItem,
  ) {
    const toGenerate = [
      {
        values: item.testSumIds,
        classRef: TestSummary,
        submissionItemName: 'testSumId',
      },
      {
        values: item.qceIds,
        classRef: QaCertEvent,
        submissionItemName: 'qaCertEventId',
      },
      {
        values: item.teeIds,
        classRef: QaTEE,
        submissionItemName: 'testExtensionExemptionId',
      },
    ];

    const promises = [];

    if (this.hasPermissions(user, orisCode, 'QA')) {
      for (const set of toGenerate) {
        const { values, classRef, submissionItemName } = set;
        for (const keyPair of values) {
          promises.push(
            this.createDynamicSubmissionRecord(
              classRef,
              setId,
              user.userId,
              facId,
              item,
              'QA',
              keyPair.quarter,
              keyPair.id,
              submissionItemName,
            ),
          );
        }
      }
    }
    return promises;
  }

  handleEmSubmission(
    setId: number,
    user: CurrentUser,
    facId: number,
    orisCode: number,
    item: SubmissionItem,
  ) {
    const promises = [];
    if (this.hasPermissions(user, orisCode, 'EM')) {
      for (const periodAbr of item.emissionsReportingPeriods) {
        promises.push(
          this.createDynamicSubmissionRecord(
            EmissionEvaluation,
            setId,
            user.userId,
            facId,
            item,
            'EM',
            periodAbr,
          ),
        );
      }

      return promises;
    }
  }
}

export default SubmissionBuilder;
