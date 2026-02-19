import { Controller } from '@nestjs/common';
import { Get, Query } from '@nestjs/common/decorators';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiExcludeControllerByEnv } from '../decorators/swagger-decorator';
import { BadRequestResponse, NotFoundResponse } from '@us-epa-camd/easey-common/utilities/common-swagger';
import { ArrayResponse } from '@us-epa-camd/easey-common/interfaces/common.interface';
import { UnitsExpectedToSubmitService } from './units-expected-to-submit.service';
import { UnitsExpectedParamsDTO } from '../dto/units-expected-params.dto';
import { UnitsExpectedDTO } from '../dto/units-expected.dto';

@Controller()
@ApiSecurity('APIKey')
@ApiTags('Units Expected to Submit Report')
@ApiExcludeControllerByEnv()
@ApiExtraModels(UnitsExpectedDTO)
export class UnitsExpectedToSubmitController {
  constructor(
    private service: UnitsExpectedToSubmitService,
  ) {}

  @Get()
  @ApiOkResponse({
    description: 'Data retrieved successfully',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(UnitsExpectedDTO) },
            },
          },
        },
      },
    },
  })
  @NotFoundResponse()
  @BadRequestResponse()
  @ApiOperation({
    description: 'Retrieves Units Expected to Submit Report (CAT) per filter criteria.',
  })
  async getUnitsExpectedToSubmit(
    @Query() params: UnitsExpectedParamsDTO,
  ): Promise<ArrayResponse<UnitsExpectedDTO>> {
    const results = await this.service.getUnitsExpectedToSubmit(params);

    return {
      items: results,
    };
  }
}