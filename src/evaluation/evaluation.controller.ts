import {
  ApiTags,
  ApiSecurity,
  ApiOkResponse,
  ApiOperation,
  ApiInternalServerErrorResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Body, Controller, Get, Post, Query, UseInterceptors } from '@nestjs/common';
import { ArrayResponse } from '@us-epa-camd/easey-common/interfaces/common.interface';
import { EvaluationService } from './evaluation.service';
import { RoleGuard, AuditLog } from '@us-epa-camd/easey-common/decorators';
import { EvaluationDTO } from '../dto/evaluation.dto';
import { EvalSubmissionQueueOrderParamsDTO, EvaluationQueuePlaceDTO } from '../dto/eval-submission-queue.dto';
import { LookupType } from '@us-epa-camd/easey-common/enums';
import { EvalErrorParamsDTO } from '../dto/eval-error-params.dto';
import { EvaluationErrorHandlerService } from './evaluation-error-handler.service';
import { LoggingInterceptor } from '@us-epa-camd/easey-common';
import { ApiExcludeControllerByEnv } from '../decorators/swagger-decorator';

@Controller()
@ApiTags('Evaluation')
@ApiSecurity('APIKey')
@ApiExcludeControllerByEnv()
export class EvaluationController {
  constructor(
    private service: EvaluationService,
    private evaluationErrorHandlerService: EvaluationErrorHandlerService,
  ) { }

  @Post('evaluate')
  @ApiOkResponse({
    description: 'Creates evaluation queue records for quartz',
  })
  @RoleGuard(
    {
      bodyParam: 'items.*.monPlanId',
      requiredRoles: ['Preparer', 'Submitter', 'Sponsor', 'Initial Authorizer'],
    },
    LookupType.MonitorPlan,
  )
  @AuditLog({
    label: 'Creates Evaluation Queue',
    requestBodyOutFields: '*',
    omitFields: ['userEmail']
  })
  async evaluate(@Body() params: EvaluationDTO): Promise<void> {
    await this.service.queueEvaluationRecords(params);
  }

  @Get('evaluate/queueOrder')
  @ApiOkResponse({
    type: EvaluationQueuePlaceDTO,
    description: 'Get evaluation queue list for users facilities',
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
    label: 'Retrieved evaluation queue lists',
    requestQueryOutFields: ['orisCodes']
  })
  async getEvaluationQueueOrder(@Query() params: EvalSubmissionQueueOrderParamsDTO): Promise<ArrayResponse<EvaluationQueuePlaceDTO>> {
    const evaluationQueueOrder = await this.service.getEvaluationQueueOrder(params);
    return {
      items: evaluationQueueOrder
    }
  }

  @Post('email/eval-error')
  @ApiOkResponse({
    description: 'Email sent successfully',
  })
  @ApiOperation({
    description: 'Sends an email to the user and to ECMPS CAMD support inbox.',
  })
  @ApiInternalServerErrorResponse()
  @UseInterceptors(LoggingInterceptor)
  async sendEvaluationErrorEmail(@Body() evalErrorParamsDTO: EvalErrorParamsDTO) {
    await this.evaluationErrorHandlerService.sendQueueingErrorEmail(evalErrorParamsDTO);
  }
}
