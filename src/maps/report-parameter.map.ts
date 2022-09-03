import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';

import { ReportParameterDTO } from '../dto/report-parameter.dto';
import { ReportParameter } from '../entities/report-parameter.entity';

@Injectable()
export class ReportParameterMap extends BaseMap<ReportParameter, ReportParameterDTO> {
  public async one(entity: ReportParameter): Promise<ReportParameterDTO> {
    return {
      position: entity.sequenceNumber,
      name: entity.name,
      defaultValue: entity.defaultValue,
    };
  }
}