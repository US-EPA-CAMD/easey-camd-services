import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';

import { ReportDetailDTO } from '../dto/report-detail.dto';
import { ReportDetail } from '../entities/report-detail.entity';
import { ReportColumnMap } from './report-column.map';
import { ReportParameterMap } from './report-parameter.map';

@Injectable()
export class ReportDetailMap extends BaseMap<ReportDetail, ReportDetailDTO> {

  constructor(
    private readonly columnMap: ReportColumnMap,
    private readonly parameterMap: ReportParameterMap
  ) {
    super();
  }

  public async one(entity: ReportDetail): Promise<ReportDetailDTO> {

    const columns = entity.columns
      ? await this.columnMap.many(entity.columns)
      : [];

    const parameters = entity.parameters
      ? await this.parameterMap.many(entity.parameters)
      : [];

    return {
      position: entity.detailOrder,
      title: entity.title,
      sqlStatement: entity.sqlStatement,
      noResultsMessage: entity.noResultsMessage,
      columns: columns,
      parameters: parameters,
      results: null,
    };
  }
}