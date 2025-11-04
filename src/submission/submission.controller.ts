import {
  ApiTags,
  ApiSecurity,
  ApiOkResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Body, Controller, Post, UseGuards, Get, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { ArrayResponse } from '@us-epa-camd/easey-common/interfaces/common.interface';
import { AuditLog, RoleGuard } from '@us-epa-camd/easey-common/decorators';
import { LookupType } from '@us-epa-camd/easey-common/enums';
import { SubmissionQueueDTO } from '../dto/submission-queue.dto';
import { ClientTokenGuard } from '@us-epa-camd/easey-common/guards';
import { SubmissionProcessService } from './submission-process.service';
import { ProcessParamsDTO } from '../dto/process-params.dto';
import { SubmissionsLastUpdatedQueryDTO, SubmissionsLastUpdatedResponseDTO } from '../dto/submission-last-updated.dto';
import { ApiExcludeControllerByEnv } from '../decorators/swagger-decorator';
import { EvalSubmissionQueueOrderParamsDTO, SubmissionQueuePlaceDTO} from '../dto/eval-submission-queue.dto';

@Controller()
@ApiTags('Submission')
@ApiSecurity('APIKey')
@ApiExcludeControllerByEnv()
export class SubmissionController {
  constructor(
    private service: SubmissionService,
    private processService: SubmissionProcessService,
  ) { }

  @Get('last-updated')
  @ApiOkResponse({
    type: SubmissionsLastUpdatedResponseDTO,
    description:
      'Returns all submission records that have been updated / submitted since the input date.',
  })
  async lastUpdated(
    @Query() params: SubmissionsLastUpdatedQueryDTO,
  ): Promise<SubmissionsLastUpdatedResponseDTO> {
    return this.service.getLastUpdated(params.date);
  }

  @Post('queue')
  @ApiOkResponse({
    description:
      'Creates submission queue records for quartz copy of record process',
  })
  @RoleGuard(
    { bodyParam: 'items.*.monPlanId', requiredRoles: ['Submitter', 'Sponsor', 'Initial Authorizer'] },
    LookupType.MonitorPlan,
  )
  @AuditLog({
    label: 'Creates Submission Queue',
    requestBodyOutFields: '*',
    omitFields: ['userEmail']
  })
  async queue(@Body() params: SubmissionQueueDTO): Promise<void> {
    await this.service.queueSubmissionRecords(params);
  }

  @Post('process')
  @ApiOkResponse({
    description:
      'Creates copy of record and calls into submission sign service',
  })
  @ApiSecurity('ClientId')
  @ApiBearerAuth('ClientToken')
  @UseGuards(ClientTokenGuard)
  @HttpCode(HttpStatus.ACCEPTED) // 202: accepted for async processing
  async process(@Body() params: ProcessParamsDTO): Promise<void> {
    // Fire-and-forget with safe error handling
    void this.processService.processSubmissionSet(params.submissionSetId)
      .catch((err) => {
        Logger.error(
          `processSubmissionSet failed for ${params.submissionSetId}: ${err?.message}`,
          err?.stack,
          'SubmissionController',
        );
      });
  }

  @Get('/queueOrder')
  @ApiOkResponse({
    type: SubmissionQueuePlaceDTO,
    description: 'Get submission queue list for users facilities',
  })
  @ApiQuery({
    style: 'pipeDelimited',
    name: 'orisCodes',
    required: true,
    explode: false,
  })
  @RoleGuard(
    {
      enforceCheckout: false,
      queryParam: 'orisCodes',
      isPipeDelimitted: true,
      enforceEvalSubmitCheck: false,
    },
    LookupType.Facility,
  )
  @AuditLog({
    label: 'Retrieved submission queue lists',
    requestQueryOutFields: ['orisCodes']
  })
  async getSubmissionQueueOrder(@Query() params: EvalSubmissionQueueOrderParamsDTO): Promise<ArrayResponse<SubmissionQueuePlaceDTO>> {
    const evaluationQueueOrder = await this.service.getSubmissionQueueOrder(params);
    return {
      items: evaluationQueueOrder
    }
  }
}
