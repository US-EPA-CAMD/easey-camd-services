import { HttpStatus, Injectable } from '@nestjs/common';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';

import { EntityManager } from 'typeorm';

import { QaTestSummaryMaintViewDTO } from '../dto/qa-test-summary-maint-vw.dto';
import { QaUpdateDto } from '../dto/qa-update.dto';

@Injectable()
export class QaTestSummaryService {
  constructor(
    private readonly manager: EntityManager,
  ) {}

  private mapToQaTestSummaryMaintViewDTO(
    row: any,
  ): QaTestSummaryMaintViewDTO {

    const dto = new QaTestSummaryMaintViewDTO();
    dto.id = row.test_sum_id;
    dto.locationId = row.location_id;
    dto.orisCode = Number(row.oris_code);
    dto.unitStack = row.unit_stack;
    dto.systemIdentifier = row.system_identifier;
    dto.componentIdentifier = row.component_identifier;
    dto.testNumber = row.test_number;
    dto.gracePeriodIndicator = Number(row.grace_period_indicator);
    dto.testTypeCode = row.test_type_cd;
    dto.testReasonCode = row.test_reason_cd;
    dto.testResultCode = row.test_result_cd;
    dto.yearQuarter = row.year_quarter;
    dto.testDescription = row.test_description;
    dto.beginDateTime = row.begin_date_time;
    dto.endDateTime = row.end_date_time;
    dto.testComment = row.test_comment;
    dto.spanScaleCode = row.span_scale_cd;
    dto.injectionProtocolCode = row.injection_protocol_cd;
    dto.submissionAvailabilityCode = row.submission_availability_cd;
    dto.submissionAvailabilityDescription = row.submission_availability_description;
    dto.severityCode = row.severity_cd;
    dto.severityDescription = row.severity_description;
    dto.resubExplanation = row.resub_explanation;
    
    return dto;
  }

  async getQaTestSummaryViewData(
    orisCode: number,
    unitStack: string,
  ): Promise<QaTestSummaryMaintViewDTO[]> {

    try {
      const rows = await this.manager.query(
          `SELECT * FROM camdecmps.get_qa_test_summary($1, $2, $3)`,
          [null, orisCode, null]);

      if (rows === null || rows.length === 0) {
        throw new EaseyException(
          new Error(`QA Test Summary Maintenance record for OrisCode ${orisCode} not found`),
          HttpStatus.NOT_FOUND,
        );
      }

      let filteredRows = rows;
      if (unitStack) {
        filteredRows = rows.filter( row => row.unit_stack === unitStack);
        if (filteredRows === null || filteredRows.length === 0) {
          throw new EaseyException(
            new Error(`QA Test Summary Maintenance record for OrisCode ${orisCode}, Locations ${unitStack} not found`),
            HttpStatus.NOT_FOUND,
          );
        }
      }

      const results: QaTestSummaryMaintViewDTO[] = [];

      filteredRows.forEach(filteredRow => {
        const dto = this.mapToQaTestSummaryMaintViewDTO(filteredRow);
        results.push(dto);
      });

      return results;

    } catch (e) {
      throw new EaseyException(e, e.status);
    }
  }

  async updateSubmissionStatus( 
    id: string,
    userId: string,
    payload: QaUpdateDto,
  ): Promise<QaTestSummaryMaintViewDTO> {

    try {
      let recordToUpdate;

      await this.manager.transaction(async (transactionalEntityManager) => {
        // UPDATE OFFICIAL TABLE
        await transactionalEntityManager.query(
          `UPDATE camdecmps.qa_supp_data 
            SET submission_availability_cd = $2,
            userid = $3,
            update_date = $4,
            resub_explanation = $5
            WHERE test_sum_id = $1;`,
          [id, 'REQUIRE', userId, currentDateTime(), payload?.resubExplanation],
        );

        // UPDATE WORKSPACE TABLE
        await transactionalEntityManager.query(
          `UPDATE camdecmpswks.qa_supp_data 
            SET submission_availability_cd = $2,
            userid = $3,
            update_date = $4,
            resub_explanation = $5
            WHERE test_sum_id = $1;`,
          [id, 'REQUIRE', userId, currentDateTime(), payload.resubExplanation],
        );

        recordToUpdate = await transactionalEntityManager.query(
          `SELECT * FROM camdecmps.get_qa_test_summary($1, $2, $3)`,
          [id, null, null]
        );

      });

      if (!recordToUpdate)
        throw new EaseyException(
          new Error(`QA Test Summary Maintenance record for id ${id} not found`),
          HttpStatus.NOT_FOUND,
        );

      return this.mapToQaTestSummaryMaintViewDTO(recordToUpdate);
    } catch (e) {
      throw new EaseyException(e, e.status);
    }
  }

  async deleteQATestSummaryData(id: string): Promise<any> {
    try {
      await this.manager.transaction(async (transactionalEntityManager) => {
        // DELETE FROM OFFICIAL TABLES
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

        // DELETE FROM WORKSPACE TABLES
        await transactionalEntityManager.query(
          `DELETE FROM camdecmpswks.test_summary 
            WHERE test_sum_id = $1`,
          [id],
        );
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
}
