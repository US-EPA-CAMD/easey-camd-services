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

@Injectable()
export class EmSubmissionAccessService {
  constructor(
    private readonly viewRepository: EmSubmissionAccessViewRepository,
    private readonly repository: EmSubmissionAccessRepository,
    private readonly map: EmSubmissionAccessMap,
  ) {}

  async getEmSubmissionAccess(
    params: EmSubmissionAccessParamsDTO,
  ): Promise<EmSubmissionAccessDTO[]> {
    let query;
    try {
      query = await this.viewRepository.getEmSubmissionAccess(params);
    } catch (e) {
      throw new EaseyException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return this.map.many(query);
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
