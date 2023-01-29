import {
  ApiTags,
  ApiQuery,
  ApiSecurity,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

import {
  Get,
  Query,
  Controller,
} from '@nestjs/common';

import { ReportDTO } from './../dto/report.dto';
import { DataSetService } from '../dataset/dataset.service';
import { ReportParamsDTO } from './../dto/report-params.dto';

@Controller()
@ApiTags('Reports')
@ApiSecurity('APIKey')
export class ReportController {
  
  constructor(
    private service: DataSetService
  ) { }

  @Get('list')
  @ApiOkResponse({
    type: ReportDTO,
    description: 'Data retrieved successfully',
  })
  @ApiOperation({
    description: 'Retrieves list of official reports available.'
  })
  async getAvailableReports() {
    return this.service.getAvailableReports();
  }

  @Get()
  @ApiOkResponse({
    type: ReportDTO,
    description: 'Data retrieved successfully',
  })
  @ApiOperation({
    description: 'Retrieves official data for various reports based on criteria.'
  })
  @ApiQuery({ style: 'pipeDelimited', name: 'testId', required: false, explode: false, })
  async getReport(
    @Query() params: ReportParamsDTO
  ) {
    return this.service.getDataSet(params);
  }
}
