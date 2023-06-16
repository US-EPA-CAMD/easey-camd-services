import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggingException } from '@us-epa-camd/easey-common/exceptions';
import { EmSubmissionAccessViewRepository } from './em-submission-access-view.repository';
import { EmSubmissionAccessMap } from '../maps/em-submission-access.map';
import { EmSubmissionAccessParamsDTO } from '../dto/em-submission-access.params.dto';
import {
  EmSubmissionAccessCreateDTO,
  EmSubmissionAccessDTO,
  EmSubmissionAccessUpdateDTO,
} from '../dto/em-submission-access.dto';
import { EmSubmissionAccessRepository } from './em-submission-access.repository';
import { EmSubmissionAccess } from '../entities/em-submission-access.entity';

@Injectable()
export class EmSubmissionAccessService {
  constructor(
    @InjectRepository(EmSubmissionAccessViewRepository)
    private readonly viewRepository: EmSubmissionAccessViewRepository,
    @InjectRepository(EmSubmissionAccessRepository)
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
      throw new LoggingException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return this.map.many(query);
  }

  async createEmSubmissionAccess(
    payload: EmSubmissionAccessCreateDTO,
    userid?: string,
  ): Promise<EmSubmissionAccessDTO> {
    try {
      const entity = this.repository.create({
        ...payload,
        userid: userid,
        dataLoadedFlag: null,
        addDate: new Date(),
        updateDate: null,
      });
      await this.repository.save(entity);
      let emSubmissionAccess = await this.viewRepository.findOne({
        where: { id: entity?.id },
      });
      const dto = await this.map.one(emSubmissionAccess);
      return dto;
    } catch (e) {
      throw new LoggingException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateEmSubmissionAccess(
    id: number,
    payload: EmSubmissionAccessUpdateDTO,
  ): Promise<EmSubmissionAccessDTO> {
    let recordToUpdate: EmSubmissionAccess;

    try {
      recordToUpdate = await this.repository.findOne(id);
      if (!recordToUpdate)
        throw new LoggingException(
          `Record with id ${id} not found`,
          HttpStatus.NOT_FOUND,
        );

      recordToUpdate.emissionStatusCode = payload?.emissionStatusCode;
      recordToUpdate.submissionAvailabilityCode =
        payload?.submissionAvailabilityCode;
      recordToUpdate.submissionTypeCode = payload?.submissionTypeCode;
      recordToUpdate.resubExplanation = payload?.resubExplanation;
      recordToUpdate.closeDate = payload?.closeDate;

      await this.repository.save(recordToUpdate);
    } catch (e) {
      throw new LoggingException(e.message, e.status);
    }

    let emSubmissionAccess = await this.viewRepository.findOne({
      where: { id: recordToUpdate?.id },
    });

    const dto = await this.map.one(emSubmissionAccess);

    return dto;
  }
}
