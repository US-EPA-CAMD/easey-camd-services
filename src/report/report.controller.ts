import {
  ApiTags,
  ApiSecurity,
  ApiOkResponse,
  ApiExcludeController,
} from '@nestjs/swagger';

import {
  Get,
  Query,
  Controller
} from '@nestjs/common';

import { ReportService } from './report.service';
import { ReportParamsDTO } from './../dto/report-params.dto';

@Controller()
@ApiTags('Reports')
@ApiSecurity('APIKey')
@ApiExcludeController()
export class ReportController {
  
  constructor(
    private service: ReportService
  ) { }

  @Get()
  @ApiOkResponse({
    description: 'Retrieves data for various reports based on criteria',
  })
  async getReport(@Query() params: ReportParamsDTO) {
    return this.service.getReport(params);
  }
}
