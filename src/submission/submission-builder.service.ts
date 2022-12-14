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
import { EmissionEvaluation } from '../entities/emission-evaluation.entity';

@Injectable()
export class SubmissionBuilder {
  returnManager() {
    return getManager();
  }

  // Pass in a generic class and type and let the dynamic submission creator do the work for the pieces of the creation that are class dependent
  async createDynamicSubmissionRecord<A>(
    c: new () => A, // The class to submit
    recordFindCondition,
    setId,
    userId,
    facId,
    item,
    type,
    qaId?, // The qa id [test_sum_id, qce_id, etc.]
    qaIdDescriptor?, //The descriptor of the qa information [i.e. the name of the entity property of the qaId]
  ) {
    return new Promise(async (resolve) => {
      const record = await this.returnManager().findOne(c, recordFindCondition);
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

      // Check for sent in from period_abbreviation of front_end

      submission.addDate = new Date();
      submission.updateDate = new Date();
      submission.facId = facId;
      submission.monPlanId = item.monPlanId;
      submission.submissionSetId = setId;
      submission.userId = userId;
      const severityCode = (
        await this.returnManager().findOne(CheckSession, record.checkSessionId)
      ).severityCode;
      submission.severityCode = severityCode;
      submission.submissionStatusCode = 'QUEUED';
      submission.submissionTypeCode = type;

      if (qaId) {
        submission[qaIdDescriptor] = qaId;
      }

      await this.returnManager().insert(Submission, submission); // Insert submission record
      resolve(true);
    });
  }

  handleMpSubmission(
    setId: number,
    userId: string,
    facId: number,
    item: SubmissionItem,
  ) {
    const promises = [];

    if (item.submitMonPlan) {
      promises.push(
        this.createDynamicSubmissionRecord(
          MonitorPlan,
          { where: { id: item.monPlanId } },
          setId,
          userId,
          facId,
          item,
          'MP',
        ),
      );
    }

    return promises;
  }

  handleQASubmission(
    setId: number,
    userId: string,
    facId: number,
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

    for (const set of toGenerate) {
      const { values, classRef, submissionItemName } = set;

      for (const dataId of values) {
        promises.push(
          this.createDynamicSubmissionRecord(
            classRef,
            { where: { id: dataId } },
            setId,
            userId,
            facId,
            item,
            'QA',
            dataId,
            submissionItemName,
          ),
        );
      }
    }

    return promises;
  }

  handleEmSubmission(
    setId: number,
    userId: string,
    facId: number,
    item: SubmissionItem,
  ) {
    const promises = [];

    if (item.submitEmissions) {
      const rptPeriodId = 115;
      promises.push(
        this.createDynamicSubmissionRecord(
          EmissionEvaluation,
          { where: { monPlanId: item.monPlanId, rptPeriodId: rptPeriodId } },
          setId,
          userId,
          facId,
          item,
          'EM',
        ),
      );
    }

    return promises;
  }
}

export default SubmissionBuilder;
