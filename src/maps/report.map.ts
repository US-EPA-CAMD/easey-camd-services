import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';

import { ReportDTO } from '../dto/report.dto';
import { Report } from '../entities/report.entity';
import { ReportDetailMap } from './report-detail.map';

@Injectable()
export class ReportMap extends BaseMap<Report, ReportDTO> {

  constructor(private readonly detailMap: ReportDetailMap) {
    super();
  }

  public async one(entity: Report): Promise<ReportDTO> {

    const details = entity.details
      ? await this.detailMap.many(entity.details)
      : [];

    return {
      title: entity.title,
      facilityName: null,
      unitStackInfo: null,
      facilityId: null,
      orisCode: null,
      stateCode: null,
      countyName: null,
      templateCode: entity.templateCode,
      noResultsMessage: entity.noResultsMessage,
      details,
    };
  }
}