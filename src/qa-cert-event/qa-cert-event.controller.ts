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
import { QaCertEventService } from './qa-cert-event.service';
import { QaCertMaintParamsDto } from '../dto/qa-cert-maint-params.dto';
import { QaCertEventMaintView } from '../entities/qa-cert-event-maint-vw.entity';

@Controller()
@ApiSecurity('APIKey')
@ApiTags('QA Cert Event Maintenance')
export class QaCertEventController {
  constructor(private service: QaCertEventService) {}

  @Get()
  @NotFoundResponse()
  @BadRequestResponse()
  @ApiOperation({
    description:
      'Retrieves QA Cert Event maintenance data per filter criteria.',
  })
  @ApiOkResponse({
    isArray: true,
    type: Number,
    description: 'Data retrieved successfully',
  })
  getQaCertEventViewData(
    @Query() params: QaCertMaintParamsDto,
  ): Promise<QaCertEventMaintView[]> {
    return this.service.getQaCertEventViewData(
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
  updateSubmissionStatus(): Promise<void> {
    return Promise.resolve();
  }

  @Delete(':id')
  @ApiOkResponse({
    description: 'Deletes a QA Cert Event record from global',
  })
  async delete(): Promise<void> {
    return Promise.resolve();
  }
}
