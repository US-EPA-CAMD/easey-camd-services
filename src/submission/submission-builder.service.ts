import { Injectable } from '@nestjs/common';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { getManager } from 'typeorm';
import { SubmissionItem } from '../dto/submission.dto';
import { CheckSession } from '../entities/check-session.entity';
import { Submission } from '../entities/submission.entity';
import { TestSummary } from '../entities/test-summary.entity';
import { QaSuppData } from '../entities/qa-supp.entity';

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

      //CHECK FOR RPT_ID AND SET IT IF POSSIBLE

      const submission = new Submission();
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
    const promises = [];

    for (const testSummaryId of item.testSumIds) {
      promises.push(
        this.createDynamicSubmissionRecord(
          TestSummary,
          { where: { id: testSummaryId } },
          setId,
          userId,
          facId,
          item,
          'QA',
          testSummaryId,
          'testSumId',
        ),
      );
    }

    return promises;
  }
}

export default SubmissionBuilder;
