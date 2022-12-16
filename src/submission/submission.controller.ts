import {
  ApiTags,
  ApiSecurity,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Controller, Body, Post, UseGuards } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { SubmissionsDTO } from '../dto/submission.dto';
import { AuthGuard } from '@us-epa-camd/easey-common/guards';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';
import { User } from '@us-epa-camd/easey-common/decorators';

@Controller()
@ApiTags('Submission')
@ApiSecurity('APIKey')
export class SubmissionController {
  constructor(private service: SubmissionService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Takes a list of submission data and submits it',
  })
  async submit(
    @User() user: CurrentUser,
    @Body() params: SubmissionsDTO,
  ): Promise<boolean> {
    return this.service.handleSubmission(user, params);
  }
}
