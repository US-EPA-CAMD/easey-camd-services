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
import { QaTestSummaryService } from './qa-test-summary.service';
import { QaTestSummaryMaintView } from '../entities/qa-test-summary-maint-vw.entity';
import { QaCertMaintParamsDto } from '../dto/qa-cert-maint-params.dto';
import { User } from '@us-epa-camd/easey-common/decorators';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';
import { QaUpdateDto } from '../dto/qa-update.dto';
import { SuccessMessageDTO } from '../dto/success-message.dto';
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
    type: QaTestSummaryMaintView,
    description: 'Data retrieved successfully',
  })
  getQaTestSummaryViewData(
    @Query() params: QaCertMaintParamsDto,
  ): Promise<QaTestSummaryMaintView[]> {
    return this.service.getQaTestSummaryViewData(
      params.orisCode,
      params.unitStack,
    );
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    isArray: false,
    type: QaTestSummaryMaintView,
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
  ): Promise<QaTestSummaryMaintView> {
    return this.service.updateSubmissionStatus(id, user.userId, payload);
  }

  @Delete(':id')
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
