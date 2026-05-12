import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { UnitsExpectedDTO } from '../dto/units-expected.dto';
import { UnitsExpectedView } from '../entities/units-expected-view.entity';

@Injectable()
export class UnitsExpectedMap extends BaseMap<UnitsExpectedView, UnitsExpectedDTO> {
  async one(entity: UnitsExpectedView): Promise<UnitsExpectedDTO> {
    return {
      facilityId: entity.facilityId,
      facilityName: entity.facilityName,
      stateCode: entity.stateCode,
      unitId: entity.unitId,
      locations: entity.locations,
      submissionTypeDescription: entity.submissionTypeDescription,
      accessBeginDate: entity.accessBeginDate,
      accessEndDate: entity.accessEndDate,
      windowStatus: entity.windowStatus,
      submissionStatus: entity.submissionStatus,
      submissionId: entity.submissionId,
      submissionDate: entity.submissionDate,
      severityDescription: entity.severityDescription,
      subRecords: entity.subRecords
    };
  }
}