import { Injectable, HttpStatus } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { QaTestSummaryMaintView } from '../entities/qa-test-summary-maint-vw.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { LoggingException } from '@us-epa-camd/easey-common/exceptions';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';
@Injectable()
export class QaTestSummaryService {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,
  ) {}

  async getQaTestSummaryViewData(
    orisCode: number,
    unitStack: string,
  ): Promise<QaTestSummaryMaintView[]> {
    const where = {
      orisCode,
    } as any;

    if (unitStack !== null && unitStack !== undefined)
      where.unitStack = unitStack;

    return this.manager.find(QaTestSummaryMaintView, {
      where,
    });
  }

  async updateSubmissionStatus(
    id: string,
    userId: string,
  ): Promise<QaTestSummaryMaintView> {
    let recordToUpdate: QaTestSummaryMaintView;

    try {
      await this.manager.transaction(async (transactionalEntityManager) => {
        // UPDATE OFFICIAL TABLE
        await transactionalEntityManager.query(
          `UPDATE camdecmps.qa_supp_data 
            SET submission_availability_cd = $2,
            userid = $3,
            update_date = $4
            WHERE test_sum_id = $1;`,
          [id, 'REQUIRE', userId, currentDateTime()],
        );

        // UPDATE WORKSPACE TABLE
        await transactionalEntityManager.query(
          `UPDATE camdecmpswks.qa_supp_data 
            SET submission_availability_cd = $2,
            userid = $3,
            update_date = $4
            WHERE test_sum_id = $1;`,
          [id, 'REQUIRE', userId, currentDateTime()],
        );
        recordToUpdate = await transactionalEntityManager.findOne(
          QaTestSummaryMaintView,
          id,
        );
      });

      if (!recordToUpdate)
        throw new LoggingException(
          `Record with id ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
    } catch (e) {
      throw new LoggingException(e.message, e.status);
    }

    return recordToUpdate;
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
      throw new LoggingException(e.message, e.status);
    }

    return {
      message: `Record with id ${id} has been successfully deleted.`,
    };
  }
}
