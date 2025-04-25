import { Injectable, HttpStatus } from '@nestjs/common';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { SubmissionReportParamsDTO } from '../dto/submission-report-params.dto';
import { SubmissionReportDTO } from '../dto/submission-report.dto';
import { SubmissionListViewRepository } from './submission-report-view.repository';
import { SubmissionListMap} from '../maps/submission-list.map';
@Injectable()
export class SubmissionReportService  {
  constructor(
    private readonly map: SubmissionListMap,
    private readonly viewRepository: SubmissionListViewRepository,
    
  ) {}

  async getSubmissionReport(
    params: SubmissionReportParamsDTO,
  ): Promise<SubmissionReportDTO[]> {
    let query;
    try{
    let rowsSubmissionReport = []

    query = await this.viewRepository.getSubmissionReportList(params)
    rowsSubmissionReport = await this.map.many(query);

    return [...rowsSubmissionReport]
    }
    catch(e)
    {
      throw new EaseyException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
