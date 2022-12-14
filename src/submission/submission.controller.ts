import { ApiTags, ApiSecurity, ApiOkResponse } from '@nestjs/swagger';
import { Controller, Body, Post, UseGuards } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { SubmissionItem, SubmissionsDTO } from '../dto/submission.dto';
import { AuthGuard } from '@us-epa-camd/easey-common/guards';

@Controller()
@ApiTags('Submission')
@ApiSecurity('APIKey')
export class SubmissionController {
  constructor(private service: SubmissionService) {}

  @Post()
  //@UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Takes a list of submission data and submits it',
  })
  async submit(@Body() params: SubmissionsDTO): Promise<boolean> {
    return this.service.handleSubmission('kherceg-dp', params);
  }
}
