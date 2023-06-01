import { Controller, UseGuards } from '@nestjs/common';
import {Get, Put, Delete } from '@nestjs/common/decorators';
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

@Controller()
@ApiSecurity('APIKey')
@ApiTags('QA Cert Event Maintenance')
export class QaCertEventController {
  constructor(private service: QaCertEventService) {}

  @Get()
  @NotFoundResponse()
  @BadRequestResponse()
  @ApiOperation({
    description: 'Retrieves QA Cert Event maintenance data per filter criteria.',
  })
  @ApiOkResponse({
    isArray: true,
    type: Number,
    description: 'Data retrieved successfully',
  })
  getQaTestData():Promise<number[]> {
    return Promise.resolve([1,2,3]);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('Token')
  @ApiOkResponse({
    description: 'Changes submission status to resubmit',
  })
  updateSubmissionStatus(): Promise<void>{
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
