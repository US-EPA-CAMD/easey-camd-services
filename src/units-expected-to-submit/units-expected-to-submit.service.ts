import { Injectable, HttpStatus } from '@nestjs/common';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { UnitsExpectedParamsDTO } from '../dto/units-expected-params.dto';
import { UnitsExpectedDTO } from '../dto/units-expected.dto';
import { UnitsExpectedRepository } from './units-expected-to-submit.repository';
import { UnitsExpectedMap } from '../maps/units-expected.map';

@Injectable()
export class UnitsExpectedToSubmitService {
  constructor(
    private readonly map: UnitsExpectedMap,
    private readonly repository: UnitsExpectedRepository,
  ) {}

  async getUnitsExpectedToSubmit(
    params: UnitsExpectedParamsDTO,
  ): Promise<UnitsExpectedDTO[]> {
    try {
      const results = await this.repository.getUnitsExpectedToSubmit(params);
      return await this.map.many(results);

    } catch (e) {
      throw new EaseyException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}