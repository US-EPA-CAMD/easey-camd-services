import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggingException } from '@us-epa-camd/easey-common/exceptions';
import { EmSubmissionAccessRepository } from './em-submission-access.repository';
import { EmSubmissionAccessMap } from '../maps/em-submission-access.map';
import { EmSubmissionAccessParamsDTO } from '../dto/em-submission-access.params.dto';
import { EmSubmissionAccessDTO } from '../dto/em-submission-access.dto';

@Injectable()
export class EmSubmissionAccessService {
  constructor(
    @InjectRepository(EmSubmissionAccessRepository)
    private readonly repository: EmSubmissionAccessRepository,
    private readonly map: EmSubmissionAccessMap,
  ) {}

  async getEmSubmissionAccess(
    params: EmSubmissionAccessParamsDTO,
  ): Promise<EmSubmissionAccessDTO[]> {
    let query;
    try {
      query = await this.repository.getEmSubmissionAccess(params);
    } catch (e) {
      throw new LoggingException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return this.map.many(query);
  }
}
