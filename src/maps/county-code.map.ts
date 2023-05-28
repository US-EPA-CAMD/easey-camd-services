import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { CountyCode } from '../entities/county-code.entity';
import { CountyCodeDTO } from '../dto/county-code.dto';

@Injectable()
export class CountyCodeMap extends BaseMap<CountyCode, CountyCodeDTO> {
  public async one(entity: CountyCode): Promise<CountyCodeDTO> {
    return {
      countyCode: entity.countyCode,
      countyNumber: entity.countyNumber,
      countyName: entity.countyName,
      stateCode: entity.stateCode,
    };
  }
}
