import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';

import { SubmissionListView } from '../entities/submission-list-vw.entity';
import { SubmissionReportParamsDTO } from '../dto/submission-report-params.dto';

@Injectable()
export class SubmissionListViewRepository extends Repository<SubmissionListView> {
  constructor(entityManager: EntityManager) {
    super(SubmissionListView, entityManager);
  }

  async getSubmissionReportList(
    params: SubmissionReportParamsDTO,
  ): Promise<SubmissionListView[]> {
    const {
      orisCode,
      year,
      quarter,
      severityCode,
      submissionType,
      submissionFrom,
      submissionTo
    } = params;
    let query = this.createQueryBuilder('ss').select([
        'ss.orisCode',
        'ss.facilityName',
        'ss.state',
        'ss.locations',
        'ss.reportingPeriod',
        'ss.reportingFrequencyCode',
        'ss.submissionTypeCode',
        'ss.submissionId',
        'ss.submissionDateTime',
        'ss.severityLevel',
        'ss.mostRecent',
        'ss.submissionStatus',
        'ss.severityCode',
        'ss.criticalErrLevelOne',
        'ss.criticalErrLevelTwo',
        'ss.nonCritical',
        'ss.infoMessage',
        'ss.adminOverride',
        'ss.submitter',
        'ss.monitorPlanId',
        'ss.reportingPeriodId'
      ]);
  
      if (orisCode) {
        query.andWhere('ss.orisCode = :orisCode', {
          orisCode
        });
      }
  
      if (quarter && year) {
        query.andWhere('ss.reportingPeriod = :reportingPeriod', {
            reportingPeriod: `${year} Q${quarter}`,
        });
      }
  
      if (severityCode) {
        query.andWhere(
          `(ss.severityCode = :severityCode)`,
          { severityCode },
        );
      }

      if (submissionType) {
        query.andWhere(
          `(ss.submissionTypeCode = :submissionType)`,
          { submissionType},
        );
      }      

      if (submissionFrom) {
        query.andWhere(
          `CAST(ss.submissionDateTime AS date) >= TO_DATE(COALESCE(:submissionFrom, '1900/01/01'), 'YYYY/MM/DD')`,
          { submissionFrom },
        );
      }

      if (submissionTo) {
        query.andWhere(
          `CAST(ss.submissionDateTime AS date) <= TO_DATE(COALESCE(:submissionTo, '9999/12/31'), 'YYYY/MM/DD')`,
          { submissionTo },
        );
      }

      return query.getMany();
    }
  }
  