import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { QaCertEventMaintView } from '../entities/qa-cert-event-maint-vw.entity';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { QaUpdateDto } from '../dto/qa-update.dto';
@Injectable()
export class QaCertEventService {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,
  ) {}

  getQaCertEventViewData(
    orisCode: number,
    unitStack: string,
  ): Promise<QaCertEventMaintView[]> {
    const where = {
      orisCode,
    } as any;

    if (unitStack !== null && unitStack !== undefined)
      where.unitStack = unitStack;

    return this.manager.find(QaCertEventMaintView, {
      where,
    });
  }

  async updateSubmissionStatus(
    id: string,
    userId: string,
    payload: QaUpdateDto,
  ): Promise<QaCertEventMaintView> {
    let recordToUpdate: QaCertEventMaintView;

    try {
      // UPDATE OFFICIAL TABLE
      await this.manager.query(
        `UPDATE camdecmps.qa_cert_event 
      SET submission_availability_cd = $2,
      userid = $3,
      update_date = $4,
      resub_explanation = $5
      WHERE qa_cert_event_id = $1`,
        [id, 'REQUIRE', userId, currentDateTime(), payload?.resubExplanation],
      );
      recordToUpdate = await this.manager.findOne(QaCertEventMaintView, id);
      if (!recordToUpdate)
        throw new EaseyException(
          new Error(`Record with id ${id} not found`),
          HttpStatus.NOT_FOUND,
        );
    } catch (e) {
      throw new EaseyException(e, e.status);
    }

    return recordToUpdate;
  }

  async deleteQACertEventData(id: string): Promise<any> {
    try {
      // DELETE FROM OFFICIAL TABLE
      await this.manager.query(
        `DELETE FROM camdecmps.qa_cert_event 
        WHERE qa_cert_event_id = $1`,
        [id],
      );
    } catch (e) {
      throw new EaseyException(e, e.status);
    }

    return {
      message: `Record with id ${id} has been successfully deleted.`,
    };
  }
}
