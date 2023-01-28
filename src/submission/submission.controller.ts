import {
  ApiTags,
  ApiSecurity,
  ApiOkResponse,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { Controller, Body, Post, UseGuards } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { SubmissionsDTO } from '../dto/submission.dto';
import { AuthGuard } from '@us-epa-camd/easey-common/guards';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';
import { User } from '@us-epa-camd/easey-common/decorators';
import { ApiExcludeControllerByEnv } from 'src/utilities/swagger-decorator.const';

@Controller()
@ApiTags('Submission')
@ApiSecurity('APIKey')
@ApiExcludeControllerByEnv()
export class SubmissionController {
  constructor(private service: SubmissionService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Data created successfully',
  })
  @ApiOperation({
    description: 'Takes a list of submission data and officialy submits to the EPA.',
  })
  async submit(
    @User() user: CurrentUser,
    @Body() params: SubmissionsDTO,
  ): Promise<boolean> {
    return this.service.handleSubmission(user, params);
  }
}
