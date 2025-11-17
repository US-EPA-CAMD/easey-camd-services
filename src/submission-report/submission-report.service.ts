import { Injectable, HttpStatus } from '@nestjs/common';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { withSlaveConnection } from '@us-epa-camd/easey-common/connection';
import { DataSource } from 'typeorm';
import { SubmissionReportParamsDTO } from '../dto/submission-report-params.dto';
import { SubmissionReportDTO } from '../dto/submission-report.dto';
import { SubmissionListViewRepository } from './submission-report-view.repository';
import { SubmissionListMap} from '../maps/submission-list.map';
@Injectable()
export class SubmissionReportService  {
  constructor(
    private readonly map: SubmissionListMap,
    private readonly viewRepository: SubmissionListViewRepository,
    private readonly dataSource: DataSource,
  ) {}

  async getSubmissionReport(
    params: SubmissionReportParamsDTO,
  ): Promise<SubmissionReportDTO[]> {
    let query;
    try{
    let rowsSubmissionReport = []

    query = await withSlaveConnection(this.dataSource, async (manager) => {
      const viewRepository = new SubmissionListViewRepository(manager);
      return await viewRepository.getSubmissionReportList(params);
    });
    rowsSubmissionReport = await this.map.many(query);

    return [...rowsSubmissionReport]
    }
    catch(e)
    {
      throw new EaseyException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
