import { HttpStatus, Injectable } from '@nestjs/common';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';

import {
  EmSubmissionAccessCreateDTO,
  EmSubmissionAccessDTO,
  EmSubmissionAccessUpdateDTO,
} from '../dto/em-submission-access.dto';
import { EmSubmissionAccessParamsDTO } from '../dto/em-submission-access.params.dto';
import { EmSubmissionAccess } from '../entities/em-submission-access.entity';
import { EmSubmissionAccessMap } from '../maps/em-submission-access.map';
import { EmSubmissionAccessViewRepository } from './em-submission-access-view.repository';
import { EmSubmissionAccessRepository } from './em-submission-access.repository';
import { EntityManager } from 'typeorm';

@Injectable()
export class EmSubmissionAccessService {
  constructor(
    private readonly viewRepository: EmSubmissionAccessViewRepository,
    private readonly repository: EmSubmissionAccessRepository,
    private readonly map: EmSubmissionAccessMap,
    private readonly entityManager: EntityManager,
  ) {}

  async getEmSubmissionAccess(
    params: EmSubmissionAccessParamsDTO,
  ): Promise<EmSubmissionAccessDTO[]> {
    let query;
    try {
      let rowsFromEmSubmissionAccessView = []
      let rowsForNoWindowStatus = []

      if (params.status === 'NO WINDOW' || params.status === undefined) {
        const sql = `SELECT * FROM camdecmpsaux.get_em_submission_access_no_window_view($1, $2, $3)`;
        const rows = await this.entityManager.query(sql, [params.orisCode, params.year, params.quarter]);
        //manually mapping each row to an EmSubmissionAccessDTO object
        rowsForNoWindowStatus = rows.map(row => {
          const dto = new EmSubmissionAccessDTO();
          dto.id = Number(row.em_sub_accessId);
          dto.facilityId = Number(row.fac_id);
          dto.facilityName = row.facility_name;
          dto.orisCode = Number(row.oris_code);
          dto.state = row.state;
          dto.locations = row.locations;
          dto.monitorPlanId = row.mon_plan_id;
          dto.reportingFrequencyCode = row.report_freq_cd;
          dto.reportingPeriodAbbreviation = row.period_abbreviation;
          dto.submissionTypeDescription = row.em_sub_type_cd_description;
          dto.submissionTypeCode = row.em_sub_type_cd;
          dto.status = 'NO WINDOW';
          dto.lastSubmissionId = row.submission_id;
          dto.severityLevel = row.severity_cd;
          dto.userid = row.userid;
          dto.addDate = null;
          dto.updateDate = null;
          return dto;
        });
      }

      if (params.status !== 'NO WINDOW') {
        query = await this.viewRepository.getEmSubmissionAccess(params);
        rowsFromEmSubmissionAccessView = await this.map.many(query);
        console.log("rowsFromEmSubmissionAccessView", rowsFromEmSubmissionAccessView)
      }

      return [...rowsFromEmSubmissionAccessView, ...rowsForNoWindowStatus]
    } catch (e) {
      throw new EaseyException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createEmSubmissionAccess(
    payload: EmSubmissionAccessCreateDTO,
    userid?: string,
  ): Promise<EmSubmissionAccessDTO> {
    const currentTime = currentDateTime();
    try {
      const entity = this.repository.create({
        ...payload,
        userid: userid,
        dataLoadedFlag: null,
        addDate: currentTime,
        updateDate: null,
        submissionTypeCode: 'RQRESUB',
        submissionAvailabilityCode: 'REQUIRE',
        emissionStatusCode: 'APPRVD',
      });
      await this.repository.save(entity);
      let emSubmissionAccess = await this.viewRepository.findOneBy({
        id: entity.id,
      });
      const dto = await this.map.one(emSubmissionAccess);
      return dto;
    } catch (e) {
      throw new EaseyException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateEmSubmissionAccess(
    id: number,
    payload: EmSubmissionAccessUpdateDTO,
  ): Promise<EmSubmissionAccessDTO> {
    let recordToUpdate: EmSubmissionAccess;
    const currentTime = currentDateTime();

    try {
      recordToUpdate = await this.repository.findOneBy({ id });
      if (!recordToUpdate)
        throw new EaseyException(
          new Error(`Record with id ${id} not found`),
          HttpStatus.NOT_FOUND,
        );

      recordToUpdate.emissionStatusCode = payload?.emissionStatusCode;
      recordToUpdate.submissionAvailabilityCode =
        payload?.submissionAvailabilityCode;
      recordToUpdate.resubExplanation = payload?.resubExplanation;
      recordToUpdate.closeDate = payload?.closeDate;
      recordToUpdate.updateDate = currentTime;

      await this.repository.save(recordToUpdate);
    } catch (e) {
      throw new EaseyException(e, e.status);
    }

    let emSubmissionAccess = await this.viewRepository.findOneBy({
      id: recordToUpdate.id,
    });

    const dto = await this.map.one(emSubmissionAccess);

    return dto;
  }
}
