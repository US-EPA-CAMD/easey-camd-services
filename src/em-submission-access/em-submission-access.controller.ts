import { Controller, UseGuards } from '@nestjs/common';
import { Get, Query, Post, Put, Body, Param } from '@nestjs/common/decorators';
import {
  ApiBearerAuth,
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
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';
import { User } from '@us-epa-camd/easey-common/decorators';

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
    description: 'Retrieves Em Submission Access Data per filter criteria.',
  })
  getEmSubmissionAccess(
    @Query() emSubmissionAccessParamsDTO: EmSubmissionAccessParamsDTO,
  ): Promise<EmSubmissionAccessDTO[]> {
    return this.service.getEmSubmissionAccess(emSubmissionAccessParamsDTO);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Creates a Em Submission Access record.',
  })
  Create(
    @Body() payload: EmSubmissionAccessCreateDTO,
    @User() user: CurrentUser,
  ): Promise<void> {
    return Promise.resolve();
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
