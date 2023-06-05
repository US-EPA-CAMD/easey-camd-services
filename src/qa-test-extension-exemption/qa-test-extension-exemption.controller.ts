import { Controller, UseGuards } from '@nestjs/common';
import { Get, Put, Delete, Query } from '@nestjs/common/decorators';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  BadRequestResponse,
  NotFoundResponse,
} from '../utilities/swagger-decorator.const';
import { AuthGuard } from '@us-epa-camd/easey-common/guards';
import { QaTestExtensionExemptionService } from './qa-test-extension-exemption.service';
import { QaCertMaintParamsDto } from '../dto/qa-cert-maint-params.dto';
import { QaTeeMaintView } from '../entities/qa-tee-maint-vw.entity';

@Controller()
@ApiSecurity('APIKey')
@ApiTags('QA Test Extension Exemption Maintenance')
export class QaTestExtensionExemptionController {
  constructor(private service: QaTestExtensionExemptionService) {}

  @Get()
  @NotFoundResponse()
  @BadRequestResponse()
  @ApiOperation({
    description:
      'Retrieves QA Test Extension Exemption maintenance recorcds per filter criteria.',
  })
  @ApiOkResponse({
    isArray: true,
    type: Number,
    description: 'Data retrieved successfully',
  })
  getQaTeeViewData(
    @Query() params: QaCertMaintParamsDto
  ): Promise<QaTeeMaintView[]> {
    return this.service.getQaTeeViewData(params.orisCode, params.unitStack);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Changes submission status to resubmit',
  })
  updateSubmissionStatus(): Promise<void> {
    return Promise.resolve();
  }

  @Delete(':id')
  @ApiOkResponse({
    description:
      'Deletes a QA Test Extension Exemption maintenance record from global',
  })
  async delete(): Promise<void> {
    return Promise.resolve();
  }
}
