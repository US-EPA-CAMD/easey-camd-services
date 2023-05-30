import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { Plant } from '../entities/plant.entity';
import { PlantDTO } from '../dto/plant.dto';

@Injectable()
export class PlantMap extends BaseMap<Plant, PlantDTO> {
  public async one(entity: Plant): Promise<PlantDTO> {
    return {
      facIdentifier: entity.facIdentifier,
      orisCode: entity.orisCode,
      facilityName: entity.facilityName,
      description: entity.description,
      state: entity.state,
      countyCode: entity.countyCode,
      sicCode: entity.sicCode,
      epaRegion: entity.epaRegion,
      nercRegion: entity.nercRegion,
      airsid: entity.airsid,
      findsid: entity.findsid,
      stateid: entity.stateid,
      latitude: entity.latitude,
      longitude: entity.longitude,
      frsIdentifier: entity.frsIdentifier,
      payeeIdentifier: entity.payeeIdentifier,
      permitEXPDate: entity.permitEXPDate,
      latlonSource: entity.latlonSource,
      tribalLandCode: entity.tribalLandCode,
      firstEcmpsRPTPeriodIdentifier: entity.firstEcmpsRPTPeriodIdentifier,
      userid: entity.userid,
      addDate: entity.addDate,
      updateDate: entity.updateDate,
    };
  }
}
