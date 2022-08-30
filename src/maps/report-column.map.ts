import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';

import { ReportColumnDTO } from '../dto/report-column.dto';
import { ReportColumn } from '../entities/report-column.entity';

@Injectable()
export class ReportColumnMap extends BaseMap<ReportColumn, ReportColumnDTO> {
  public async one(entity: ReportColumn): Promise<ReportColumnDTO> {
    return {
      position: entity.sequenceNumber,
      name: entity.name,
      displayName: entity.displayName,
    };
  }
}
