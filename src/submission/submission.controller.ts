import { ApiTags, ApiSecurity, ApiOkResponse } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { RoleGuard } from '@us-epa-camd/easey-common/decorators';
import { LookupType } from '@us-epa-camd/easey-common/enums';
import { SubmissionQueueDTO } from '../dto/submission-queue.dto';

@Controller()
@ApiTags('Submission')
@ApiSecurity('APIKey')
export class SubmissionController {
  constructor(private service: SubmissionService) {}

  @Post('submission-queue')
  @ApiOkResponse({
    description:
      'Creates submission queue records for quartz copy of record process',
  })
  @RoleGuard({ bodyParam: 'items.*.monPlanId' }, LookupType.MonitorPlan)
  async evaluate(@Body() params: SubmissionQueueDTO): Promise<void> {
    await this.service.queueSubmissionRecords(params);
  }
}
