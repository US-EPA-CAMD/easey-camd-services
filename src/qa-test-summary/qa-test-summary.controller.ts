import { Controller, UseGuards } from '@nestjs/common';
import { Get, Put, Delete, Query, Param } from '@nestjs/common/decorators';
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
    type: Number,
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
    description: 'Changes submission status to resubmit',
  })
  updateSubmissionStatus(
    @Param('id') id: string,
    @User() user: CurrentUser,
  ): Promise<QaTestSummaryMaintView> {
    return this.service.updateSubmissionStatus(id, user.userId);
  }

  @Delete(':id')
  @ApiOkResponse({
    description: 'Deletes a QA Test record in workspace and global',
  })
  async delete(): Promise<void> {
    return Promise.resolve();
  }
}
