import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggingException } from '@us-epa-camd/easey-common/exceptions';
import { EmSubmissionAccessViewRepository } from './em-submission-access-view.repository';
import { EmSubmissionAccessMap } from '../maps/em-submission-access.map';
import { EmSubmissionAccessParamsDTO } from '../dto/em-submission-access.params.dto';
import {
  EmSubmissionAccessCreateDTO,
  EmSubmissionAccessDTO,
} from '../dto/em-submission-access.dto';
import { EmSubmissionAccessRepository } from './em-submission-access.repository';

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
      let emSubmissionAcess = await this.viewRepository.findOne({
        where: { id: entity?.id },
      });
      const dto = await this.map.one(emSubmissionAcess);
      return dto;
    } catch (e) {
      throw new LoggingException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
