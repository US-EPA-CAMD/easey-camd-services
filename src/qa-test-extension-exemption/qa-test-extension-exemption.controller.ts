import { Controller, UseGuards } from '@nestjs/common';
import {
  Get,
  Put,
  Delete,
  Query,
  Param,
  Body,
} from '@nestjs/common/decorators';
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
import { User } from '@us-epa-camd/easey-common/decorators';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';
import { QaUpdateDto } from '../dto/qa-update.dto';
import { SuccessMessageDTO } from '../dto/success-message.dto';
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
    type: QaTeeMaintView,
    description: 'Data retrieved successfully',
  })
  getQaTeeViewData(
    @Query() params: QaCertMaintParamsDto,
  ): Promise<QaTeeMaintView[]> {
    return this.service.getQaTeeViewData(params.orisCode, params.unitStack);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    isArray: false,
    type: QaTeeMaintView,
    description: 'Changes submission status to resubmit',
  })
  @ApiOperation({
    description:
      'Changes submission status to resubmit and update re-submission explanation for QA Test maintenance record.',
  })
  updateSubmissionStatus(
    @Param('id') id: string,
    @User() user: CurrentUser,
    @Body() payload: QaUpdateDto,
  ): Promise<QaTeeMaintView> {
    return this.service.updateSubmissionStatus(id, user.userId, payload);
  }

  @Delete(':id')
  @ApiOkResponse({
    isArray: false,
    type: SuccessMessageDTO,
    description:
      'Deletes a QA Test Extension Exemption maintenance record successfully.',
  })
  @ApiOperation({
    description:
      'Deletes a QA Test Extension Exemption maintenance record from global.',
  })
  async deleteQACertTeeData(@Param('id') id: string): Promise<any> {
    return this.service.deleteQACertTeeData(id);
  }
}
