import { Controller } from '@nestjs/common';
import {
  Get,
  Put,
  Delete,
  Query,
  Param,
  Body,
} from '@nestjs/common/decorators';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  BadRequestResponse,
  NotFoundResponse,
} from '../utilities/swagger-decorator.const';
import { QaTestSummaryService } from './qa-test-summary.service';
import { QaCertMaintParamsDto } from '../dto/qa-cert-maint-params.dto';
import { RoleGuard, User } from '@us-epa-camd/easey-common/decorators';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';
import { QaUpdateDto } from '../dto/qa-update.dto';
import { SuccessMessageDTO } from '../dto/success-message.dto';
import { QaTestSummaryMaintViewDTO } from '../dto/qa-test-summary-maint-vw.dto';
import { LookupType } from '@us-epa-camd/easey-common/enums';
@Controller()
@ApiSecurity('APIKey')
@ApiTags('QA Test Data Maintenance')
export class QaTestSummaryController {
  constructor(private service: QaTestSummaryService) {}

  @Get()
  @NotFoundResponse()
  @BadRequestResponse()
  @ApiOperation({
    description: 'Retrieves QA test maintenance records per filter criteria.',
  })
  @ApiOkResponse({
    isArray: true,
    type: QaTestSummaryMaintViewDTO,
    description: 'Data retrieved successfully',
  })
  getQaTestSummaryViewData(
    @Query() params: QaCertMaintParamsDto,
  ): Promise<QaTestSummaryMaintViewDTO[]> {
    return this.service.getQaTestSummaryViewData(
      params.orisCode,
      params.unitStack,
    );
  }

  @Put(':id')
  @RoleGuard({ requiredRoles: ['ECMPS Admin'] }, LookupType.MonitorPlan)
  @ApiOkResponse({
    isArray: false,
    type: QaTestSummaryMaintViewDTO,
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
  ): Promise<QaTestSummaryMaintViewDTO> {
    return this.service.updateSubmissionStatus(id, user.userId, payload);
  }

  @Delete(':id')
  @RoleGuard({ requiredRoles: ['ECMPS Admin'] }, LookupType.MonitorPlan)
  @ApiOkResponse({
    isArray: false,
    type: SuccessMessageDTO,
    description: 'Deletes a QA Test maintenance record successfully.',
  })
  @ApiOperation({
    description: 'Deletes a QA Test maintenance record.',
  })
  async deleteQATestSummaryData(@Param('id') id: string): Promise<any> {
    return this.service.deleteQATestSummaryData(id);
  }
}
