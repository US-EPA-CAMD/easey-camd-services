import {
  ApiTags,
  ApiQuery,
  ApiSecurity,
  ApiOkResponse,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';

import {
  Get,
  Query,
  Controller,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@us-epa-camd/easey-common/guards';

import { ReportDTO } from 'src/dto/report.dto';
import { DataSetService } from '../dataset/dataset.service';
import { ReportParamsDTO } from '../dto/report-params.dto';
import { ApiExcludeControllerByEnv } from '../utilities/swagger-decorator.const';

@Controller()
@ApiTags('Reports')
@ApiSecurity('APIKey')
@ApiExcludeControllerByEnv()
export class ReportWorkspaceController {
  
  constructor(
    private service: DataSetService
  ) { }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    type: ReportDTO,
    description: 'Data retrieved successfully',
  })
  @ApiOperation({
    description: 'Retrieves workspace data for various reports based on criteria.'
  })
  @ApiQuery({ style: 'pipeDelimited', name: 'testId', required: false, explode: false, })
  async getReport(
    @Query() params: ReportParamsDTO
  ) {
    return this.service.getDataSet(params, true);
  }
}
