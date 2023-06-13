import { Controller, UseGuards } from '@nestjs/common';
import { Get, Query, Post, Put, Body, Param } from '@nestjs/common/decorators';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiExcludeControllerByEnv,
  BadRequestResponse,
  NotFoundResponse,
} from '../utilities/swagger-decorator.const';
import { EmSubmissionAccessService } from './em-submission-access.service';
import {
  EmSubmissionAccessCreateDTO,
  EmSubmissionAccessDTO,
  EmSubmissionAccessUpdateDTO,
} from '../dto/em-submission-access.dto';
import { EmSubmissionAccessParamsDTO } from '../dto/em-submission-access.params.dto';
import { AuthGuard } from '@us-epa-camd/easey-common/guards';
import { User } from '@us-epa-camd/easey-common/decorators';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';

@Controller()
@ApiSecurity('APIKey')
@ApiTags('Em Submission Access')
@ApiExcludeControllerByEnv()
export class EmSubmissionAccessController {
  constructor(private service: EmSubmissionAccessService) {}

  @Get()
  @ApiOkResponse({
    isArray: true,
    type: EmSubmissionAccessDTO,
    description: 'Data retrieved successfully',
  })
  @NotFoundResponse()
  @BadRequestResponse()
  @ApiOperation({
    description:
      'Retrieves Emission Submission Access Data per filter criteria.',
  })
  getEmSubmissionAccess(
    @Query() emSubmissionAccessParamsDTO: EmSubmissionAccessParamsDTO,
  ): Promise<EmSubmissionAccessDTO[]> {
    return this.service.getEmSubmissionAccess(emSubmissionAccessParamsDTO);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Token')
  @ApiCreatedResponse({
    description: 'Data created successfully',
  })
  @ApiOperation({
    description:
      'Creates an Emission Submission Access Record.',
  })
  async createEmSubmissionAccess(
    @Body() payload: EmSubmissionAccessCreateDTO,
    @User() user: CurrentUser,
  ) {
    return this.service.createEmSubmissionAccess(payload, user.userId);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Update a Em Submission Access record.',
  })
  Update(
    @Param('id') id: string,
    @Body() payload: EmSubmissionAccessUpdateDTO,
    @User() user: CurrentUser,
  ): Promise<void> {
    return Promise.resolve();
  }
}
