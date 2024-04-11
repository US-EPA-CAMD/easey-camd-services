import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';
import { EntityManager } from 'typeorm';

import { QaTeeMaintViewDTO } from '../dto/qa-tee-maint-vw.dto';
import { QaUpdateDto } from '../dto/qa-update.dto';
import { QaTeeMaintView } from '../entities/qa-tee-maint-vw.entity';
import { QaTeeMaintMap } from '../maps/qa-tee-maint.map';

@Injectable()
export class QaTestExtensionExemptionService {
  constructor(
    private readonly manager: EntityManager,
    private readonly map: QaTeeMaintMap,
  ) {}

  async getQaTeeViewData(
    orisCode: number,
    unitStack: string,
  ): Promise<QaTeeMaintViewDTO[]> {
    const where = {
      orisCode,
    } as any;

    if (unitStack !== null && unitStack !== undefined)
      where.unitStack = unitStack;

    const result = await this.manager.find(QaTeeMaintView, {
      where,
    });
    return this.map.many(result);
  }

  async updateSubmissionStatus(
    id: string,
    userId: string,
    payload: QaUpdateDto,
  ): Promise<QaTeeMaintViewDTO> {
    let recordToUpdate: QaTeeMaintView;

    try {
      // UPDATE OFFICIAL TABLE
      await this.manager.query(
        `UPDATE camdecmps.test_extension_exemption 
      SET submission_availability_cd = $2,
      userid = $3,
      update_date = $4,
      resub_explanation = $5
      WHERE test_extension_exemption_id = $1`,
        [id, 'REQUIRE', userId, currentDateTime(), payload?.resubExplanation],
      );
      recordToUpdate = await this.manager.findOneBy(QaTeeMaintView, {
        testExtensionExemptionId: id,
      });
      if (!recordToUpdate)
        throw new EaseyException(
          new Error(`Record with id ${id} not found`),
          HttpStatus.NOT_FOUND,
        );
    } catch (e) {
      throw new EaseyException(e, e.status);
    }

    return this.map.one(recordToUpdate);
  }

  async deleteQACertTeeData(id: string): Promise<any> {
    try {
      // DELETE FROM OFFICIAL TABLE
      await this.manager.query(
        `DELETE FROM camdecmps.test_extension_exemption 
        WHERE test_extension_exemption_id = $1`,
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
