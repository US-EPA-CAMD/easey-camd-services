
    import { Injectable } from '@nestjs/common';
    import { BaseMap } from '@us-epa-camd/easey-common/maps';
    import { StateCode } from '../entities/state-code.entity';
    import { StateCodeDTO } from '../dto/state-code.dto';
    
    @Injectable()
    export class StateCodeMap extends BaseMap<StateCode, StateCodeDTO> {
      public async one(entity: StateCode): Promise<StateCodeDTO> {
        return {
          stateCode: entity.stateCode,
stateName: entity.stateName,
domesticIndicator: entity.domesticIndicator,
indianCountryIndicator: entity.indianCountryIndicator,
epaRegion: entity.epaRegion,

        };
      }
    }
    