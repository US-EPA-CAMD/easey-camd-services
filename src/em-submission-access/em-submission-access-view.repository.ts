import { EntityRepository, Repository } from 'typeorm';

import { EmSubmissionAccessParamsDTO } from '../dto/em-submission-access.params.dto';
import { EmSubmissionAccessView } from '../entities/em-submission-access-vw.entity';

@EntityRepository(EmSubmissionAccessView)
export class EmSubmissionAccessViewRepository extends Repository<EmSubmissionAccessView> {
  async getEmSubmissionAccess(
    params: EmSubmissionAccessParamsDTO,
  ): Promise<EmSubmissionAccessView[]> {
    const { facilityId, monitorPlanId, year, quarter, status } = params;
    let query = this.createQueryBuilder('em').select([
      'em.id',
      'em.facilityId',
      'em.orisCode',
      'em.monitorPlanId',
      'em.state',
      'em.locations',
      'em.reportingPeriodId',
      'em.reportingFrequencyCode',
      'em.openDate',
      'em.closeDate',
      'em.emissionStatusCode',
      'em.submissionAvailabilityCode',
      'em.lastSubmissionId',
      'em.submissionTypeCode',
      'em.severityLevel',
      'em.userid',
      'em.addDate',
      'em.updateDate',
      'em.year',
      'em.quarter',
    ]);

    if (facilityId) {
      query.andWhere('em.orisCode = :facilityId', {
        facilityId: facilityId,
      });
    }

    if (monitorPlanId) {
      query.andWhere('em.monitorPlanId = :monitorPlanId', {
        monitorPlanId: monitorPlanId,
      });
    }

    if (year) {
      query.andWhere('em.year = :year', {
        year: year,
      });
    }

    if (quarter) {
      query.andWhere('em.quarter = :quarter', {
        quarter: quarter,
      });
    }

    // need to add case for when emissionStatusCode is APPRVD but submissionAvailabilityCode is not REQUIRE or GRANTED
    if (status === 'OPEN') {
      query.andWhere(
        `(em.emissionStatusCode = 'APPRVD') AND (em.submissionAvailabilityCode = 'REQUIRE' OR em.submissionAvailabilityCode = 'GRANTED')`,
        { status: status },
      );
    }
    if (status === 'PENDING') {
      query.andWhere(`em.emissionStatusCode = 'PENDING'`, { status: status });
    }
    if (status === 'CLOSED') {
      query.andWhere(`em.emissionStatusCode = 'RECVD'`, { status: status });
    }

    return query.getMany();
  }
}
