import { HttpStatus, Injectable } from '@nestjs/common';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { Logger } from '@us-epa-camd/easey-common/logger';
import {
  currentDateTime,
  dateToEstString,
} from '@us-epa-camd/easey-common/utilities/functions';
import { EntityManager } from 'typeorm';

import { QaTestSummaryMaintViewDTO } from '../dto/qa-test-summary-maint-vw.dto';
import { QaUpdateDto } from '../dto/qa-update.dto';
import { QaMaintenanceAction } from '../enums/admin-actions.enum';
import { QaType } from '../enums/qa-type.enum';
import { QaTestSummaryMaintView } from '../entities/qa-test-summary-maint-vw.entity';
import { QaTestSummaryMaintMap } from '../maps/qa-test-summary-maint.map';
import { formatQaMaintenanceLogMessage } from '../utilities/utils';

@Injectable()
export class QaTestSummaryService {
  constructor(
    private readonly manager: EntityManager,
    private readonly map: QaTestSummaryMaintMap,
    private readonly logger: Logger,
  ) {
    this.logger.setContext('QaTestSummaryService');
  }

  async getQaTestSummaryViewData(
    orisCode: number,
    unitStack: string,
  ): Promise<QaTestSummaryMaintViewDTO[]> {
    const where = {
      orisCode,
    } as any;

    if (unitStack !== null && unitStack !== undefined)
      where.unitStack = unitStack;

    const result = await this.manager.find(QaTestSummaryMaintView, {
      where,
    });
    return this.map.many(result);
  }

  async updateSubmissionStatus(
    id: string,
    userId: string,
    payload: QaUpdateDto,
  ): Promise<QaTestSummaryMaintViewDTO> {
    let recordToUpdate: QaTestSummaryMaintView;

    try {
      const updateDateTime = currentDateTime();

      await this.manager.transaction(async (transactionalEntityManager) => {
        // UPDATE OFFICIAL TABLE
        await transactionalEntityManager.query(
          `UPDATE camdecmps.qa_supp_data 
            SET submission_availability_cd = $2,
            userid = $3,
            update_date = $4,
            resub_explanation = $5
            WHERE test_sum_id = $1;`,
          [id, 'REQUIRE', userId, updateDateTime, payload?.resubExplanation],
        );

        // UPDATE WORKSPACE TABLE
        await transactionalEntityManager.query(
          `UPDATE camdecmpswks.qa_supp_data 
            SET submission_availability_cd = $2,
            userid = $3,
            update_date = $4,
            resub_explanation = $5
            WHERE test_sum_id = $1;`,
          [id, 'REQUIRE', userId, updateDateTime, payload.resubExplanation],
        );
      });

      recordToUpdate = await this.manager.findOneBy(QaTestSummaryMaintView, {
        testSumId: id,
      });

      if (!recordToUpdate) {
        throw new EaseyException(
          new Error(`Record with id ${id} not found`),
          HttpStatus.NOT_FOUND,
        );
      }

      this.logger.log(
        ...QaTestSummaryService.formatQaTestSummaryMaintenanceLogMessage(
          recordToUpdate,
          QaMaintenanceAction.UPDATE,
          userId,
          updateDateTime,
        ),
      );
    } catch (e) {
      throw new EaseyException(e, e.status);
    }

    return this.map.one(recordToUpdate);
  }

  async deleteQATestSummaryData(id: string): Promise<any> {
    try {
      await this.manager.transaction(async (transactionalEntityManager) => {
        // DELETE FROM OFFICIAL TABLE
        await transactionalEntityManager.query(
          `DELETE FROM camdecmps.test_summary 
            WHERE test_sum_id = $1`,
          [id],
        );
        await transactionalEntityManager.query(
          `DELETE FROM camdecmps.qa_supp_data 
            WHERE test_sum_id = $1`,
          [id],
        );

        // DELETE FROM WORKSPACE TABLE
        await transactionalEntityManager.query(
          `DELETE FROM camdecmpswks.qa_supp_data 
            WHERE test_sum_id = $1`,
          [id],
        );
      });
    } catch (e) {
      throw new EaseyException(e, e.status);
    }

    return {
      message: `Record with id ${id} has been successfully deleted.`,
    };
  }

  static formatQaTestSummaryMaintenanceLogMessage(
    record: QaTestSummaryMaintView,
    action: QaMaintenanceAction,
    userId: string,
    timestamp: Date,
  ) {
    const data = {
      'Begin Date/Time': dateToEstString(record.beginDateTime),
      'End Date/Time': dateToEstString(record.endDateTime),
      'MP Location': record.locationId,
      'Facility ORIS': record.orisCode,
      'Reporting Period': record.yearQuarter,
      'Resubmission Reason': record.resubExplanation,
      'Severity Description': record.severityDescription,
      'Submission Availability Description':
        record.submissionAvailabilityDescription,
      'System/Component ID':
        record.systemIdentifier ?? record.componentIdentifier,
      'Test Number': record.testNumber,
      'Test Summary ID': record.testSumId,
      'Test Type Code': record.testTypeCode,
      'Unit/StackPipe ID': record.unitStack,
    };
    return formatQaMaintenanceLogMessage({
      action,
      data,
      qaType: QaType.TEST_SUMMARY,
      timestamp,
      userId,
    });
  }
}
