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
import { QaTestDataService } from './qa-test-data.service';

@Controller()
@ApiSecurity('APIKey')
@ApiTags('QA Test Data Maintenance')
export class QaTestDataController {
  constructor(private service: QaTestDataService) {}

  @Get()
  @NotFoundResponse()
  @BadRequestResponse()
  @ApiOperation({
    description: 'Retrieves QA test data maintenance recorcds per filter criteria.',
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
    description: 'Deletes a QA Test record in workspace and global',
  })
  async delete(): Promise<void> {
    return Promise.resolve();
  }
}
