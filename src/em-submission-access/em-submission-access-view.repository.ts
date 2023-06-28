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
      'em.facilityName',
      'em.orisCode',
      'em.monitorPlanId',
      'em.state',
      'em.locations',
      'em.reportingPeriodId',
      'em.reportingFrequencyCode',
      'em.reportingPeriodAbbreviation',
      'em.openDate',
      'em.closeDate',
      'em.emissionStatusCode',
      'em.submissionAvailabilityCode',
      'em.lastSubmissionId',
      'em.submissionTypeDescription',
      'em.severityLevel',
      'em.userid',
      'em.addDate',
      'em.updateDate',
      'em.year',
      'em.quarter',
      'em.resubExplanation',
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

    if (status === 'OPEN') {
      query.andWhere(
        `(em.emissionStatusCode = 'APPRVD') AND (em.submissionAvailabilityCode IN ('REQUIRE', 'GRANTED') OR em.submissionAvailabilityCode IS NULL)`,
        { status: status },
      );
    }
    if (status === 'PENDING') {
      query.andWhere(
        `(em.emissionStatusCode = 'PENDING') AND (em.submissionAvailabilityCode IN ('REQUIRE', 'GRANTED') OR em.submissionAvailabilityCode IS NULL)`,
        { status: status },
      );
    }
    if (status === 'CLOSED') {
      query.andWhere(
        `(em.emissionStatusCode = 'RECVD' OR em.submissionAvailabilityCode IN ('DELETE','CRITERR', 'NOTSUB'))`,
        { status: status },
      );
    }

    return query.getMany();
  }
}
