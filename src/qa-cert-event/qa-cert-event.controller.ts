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
import { QaCertEventService } from './qa-cert-event.service';
import { QaCertMaintParamsDto } from '../dto/qa-cert-maint-params.dto';
import { User } from '@us-epa-camd/easey-common/decorators';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';
import { QaUpdateDto } from '../dto/qa-update.dto';
import { SuccessMessageDTO } from '../dto/success-message.dto';
import { QaCertEventMaintViewDTO } from '../dto/qa-cert-event-maint-vw.dto';

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
    type: QaCertEventMaintViewDTO,
    description: 'Data retrieved successfully',
  })
  getQaCertEventViewData(
    @Query() params: QaCertMaintParamsDto,
  ): Promise<QaCertEventMaintViewDTO[]> {
    return this.service.getQaCertEventViewData(
      params.orisCode,
      params.unitStack,
    );
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    isArray: false,
    type: QaCertEventMaintViewDTO,
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
  ): Promise<QaCertEventMaintViewDTO> {
    return this.service.updateSubmissionStatus(id, user.userId, payload);
  }

  @Delete(':id')
  @ApiOkResponse({
    isArray: false,
    type: SuccessMessageDTO,
    description: 'Deletes a QA Cert Event record successfully.',
  })
  @ApiOperation({
    description: 'Deletes a QA Cert Event record from global.',
  })
  async deleteQACertEventData(@Param('id') id: string): Promise<any> {
    return this.service.deleteQACertEventData(id);
  }
}
