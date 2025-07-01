import { Controller } from '@nestjs/common';
import {
  Get,
  Query,
} from '@nestjs/common/decorators';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags, ApiExtraModels, getSchemaPath, ApiQuery } from '@nestjs/swagger';
import { ApiExcludeControllerByEnv } from '../decorators/swagger-decorator';
import { BadRequestResponse, NotFoundResponse } from '@us-epa-camd/easey-common/utilities/common-swagger';
import { ArrayResponse } from '@us-epa-camd/easey-common/interfaces/common.interface';
import { SubmissionReportService } from './submission-report.service';
import { SubmissionReportParamsDTO } from '../dto/submission-report-params.dto';
import { SubmissionReportDTO } from '../dto/submission-report.dto';
import { Logger } from '@us-epa-camd/easey-common/logger';

@Controller()
@ApiSecurity('APIKey')
@ApiTags('Submission Report')
@ApiExcludeControllerByEnv()
@ApiExtraModels(SubmissionReportDTO)
export class SubmissionReportController {
  constructor(
    private readonly logger: Logger,
    private service: SubmissionReportService
  ) {
    this.logger.setContext('SubmissionReportController')
  }

  @Get()
  @ApiOkResponse({
    type: SubmissionReportDTO,
    description: 'Data retrieved successfully',
    content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(SubmissionReportDTO) },
              },
            },
          },
        },
      }
  })
  @NotFoundResponse()
  @BadRequestResponse()
  @ApiQuery({
      style: 'pipeDelimited',
      name: 'locations',
      required: false,
      explode: false,
    })
  @ApiOperation({
    description: 'Retrieves Submission Report (CAT) per filter criteria.',
  })
  async getSubmissionReport(
    @Query() submissionReportParamsDTO: SubmissionReportParamsDTO,
  ): Promise<ArrayResponse<SubmissionReportDTO>> {

    this.logger.info(submissionReportParamsDTO)
    const submissionReports = await this.service.getSubmissionReport(submissionReportParamsDTO);

    return  {
      items: submissionReports
    };
  }
}
