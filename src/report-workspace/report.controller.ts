import {
  ApiTags,
  ApiQuery,
  ApiSecurity,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import {
  Get,
  Query,
  Controller,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@us-epa-camd/easey-common/guards';

import { ReportService } from '../report/report.service';
import { ReportParamsDTO } from '../dto/report-params.dto';

@Controller()
@ApiTags('Reports')
@ApiSecurity('APIKey')
export class ReportWorkspaceController {
  
  constructor(
    private service: ReportService
  ) { }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Retrieves workspace data for various reports based on criteria',
  })
  @ApiQuery({ style: 'pipeDelimited', name: 'testId', required: false, explode: false, })
  async getReport(
    @Query() params: ReportParamsDTO
  ) {
    return this.service.getReport(params, true);
  }
}
