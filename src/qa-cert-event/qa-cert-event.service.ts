import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { QaCertEventMaintView } from '../entities/qa-cert-event-maint-vw.entity';
import { LoggingException } from '@us-epa-camd/easey-common/exceptions';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';
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
  ): Promise<QaCertEventMaintView> {
    let recordToUpdate: QaCertEventMaintView;

    try {
      // UPDATE OFFICIAL TABLE
      await this.manager.query(
        `UPDATE camdecmps.qa_cert_event 
      SET submission_availability_cd = $2,
      userid = $3,
      update_date = $4
      WHERE qa_cert_event_id = $1`,
        [id, 'REQUIRE', userId, currentDateTime()],
      );
      recordToUpdate = await this.manager.findOne(QaCertEventMaintView, id);
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
}