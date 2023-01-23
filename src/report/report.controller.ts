import {
  ApiTags,
  ApiQuery,
  ApiSecurity,
  ApiOkResponse,
} from '@nestjs/swagger';

import {
  Get,
  Query,
  Controller,
} from '@nestjs/common';

import { DataSetService } from '../dataset/dataset.service';
import { ReportParamsDTO } from './../dto/report-params.dto';

@Controller()
@ApiTags('Reports')
@ApiSecurity('APIKey')
export class ReportController {
  
  constructor(
    private service: DataSetService
  ) { }

  @Get()
  @ApiOkResponse({
    description: 'Retrieves official data for various reports based on criteria',
  })
  @ApiQuery({ style: 'pipeDelimited', name: 'testId', required: false, explode: false, })
  async getReport(
    @Query() params: ReportParamsDTO
  ) {
    return this.service.getDataSet(params);
  }
}
