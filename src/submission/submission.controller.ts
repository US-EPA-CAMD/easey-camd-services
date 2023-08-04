import {
  ApiTags,
  ApiSecurity,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { RoleGuard } from '@us-epa-camd/easey-common/decorators';
import { LookupType } from '@us-epa-camd/easey-common/enums';
import { SubmissionQueueDTO } from '../dto/submission-queue.dto';
import { ClientTokenGuard } from '@us-epa-camd/easey-common/guards';
import { SubmissionProcessService } from './submission-process.service';
import { ProcessParamsDTO } from '../dto/process-params.dto';

@Controller()
@ApiTags('Submission')
@ApiSecurity('APIKey')
export class SubmissionController {
  constructor(
    private service: SubmissionService,
    private processService: SubmissionProcessService,
  ) {}

  @Post('queue')
  @ApiOkResponse({
    description:
      'Creates submission queue records for quartz copy of record process',
  })
  @RoleGuard({ bodyParam: 'items.*.monPlanId' }, LookupType.MonitorPlan)
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
  async process(@Body() params: ProcessParamsDTO): Promise<void> {
    this.processService.processSubmissionSet(params.submissionSetId);
  }
}
