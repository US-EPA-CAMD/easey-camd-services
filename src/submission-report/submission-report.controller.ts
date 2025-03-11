import { Controller } from '@nestjs/common';
import {
  Get,
  Query,
} from '@nestjs/common/decorators';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiExcludeControllerByEnv } from '../decorators/swagger-decorator';
import { BadRequestResponse, NotFoundResponse } from '@us-epa-camd/easey-common/utilities/common-swagger';
import { ArrayResponse } from '@us-epa-camd/easey-common/interfaces/common.interface';
import { SubmissionReportService } from './submission-report.service';
import { SubmissionReportParamsDTO } from 'src/dto/submission-report-params.dto';
import { SubmissionReportDTO } from 'src/dto/submission-report.dto';
import { Logger } from '@us-epa-camd/easey-common/logger';

@Controller()
@ApiSecurity('APIKey')
@ApiTags('Submission Report')
@ApiExcludeControllerByEnv()
export class SubmissionReportController {
  constructor(
    private readonly logger: Logger,
    private service: SubmissionReportService
  ) {
    this.logger.setContext('SubmissionReportController')
  }

  @Get()
  @ApiOkResponse({
    isArray: true,
    type: SubmissionReportDTO,
    description: 'Data retrieved successfully',
  })
  @NotFoundResponse()
  @BadRequestResponse()
  @ApiOperation({
    description: 'Retrieves Submission Report (CAT) per filter criteria.',
  })
  async getSubmissionReprot(
    @Query() submissionReportParamsDTO: SubmissionReportParamsDTO,
  ): Promise<ArrayResponse<SubmissionReportDTO>> {

    this.logger.info(submissionReportParamsDTO)
    const submissionReports = await this.service.getSubmissinReport(submissionReportParamsDTO);

    return  {
      items: submissionReports
    };
  }
}
