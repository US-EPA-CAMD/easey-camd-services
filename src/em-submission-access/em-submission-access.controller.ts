import { Controller } from '@nestjs/common';
import { Get, Query } from '@nestjs/common/decorators';
import {
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
import { EmSubmissionAccessDTO } from '../dto/em-submission-access.dto';
import { EmSubmissionAccessParamsDTO } from '../dto/em-submission-access.params.dto';

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
}
