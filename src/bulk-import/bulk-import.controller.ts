import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiOkResponse, ApiSecurity, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { RoleGuard, User } from '@us-epa-camd/easey-common/decorators';
import { LookupType } from '@us-epa-camd/easey-common/enums';
import { AuthGuard, ClientTokenGuard } from '@us-epa-camd/easey-common/guards';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';

import { ApiExcludeControllerByEnv } from '../decorators/swagger-decorator';
import {
  DeleteImportFilesDTO,
  ImportQueueRequestDTO,
  ImportSetDTO,
  ProcessImportDTO,
  StagedFileDTO,
} from '../dto/bulk-import.dto';
import { BulkImportProcessService } from './bulk-import-process.service';
import { BulkImportService } from './bulk-import.service';

@Controller()
@ApiTags('Bulk Import')
@ApiSecurity('APIKey')
@ApiExcludeControllerByEnv()
export class BulkImportController {
  constructor(
    private readonly service: BulkImportService,
    private readonly processService: BulkImportProcessService,
  ) {}

  @Post('set/:id/stage')
  @ApiOkResponse({
    type: StagedFileDTO,
    isArray: true,
    description: 'Stages the uploaded files and returns their parsed metadata',
  })
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  async stage(
    @Param('id') importSetId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<StagedFileDTO[]> {
    return this.service.stageFiles(importSetId, files);
  }

  // With a body of s3Paths, removes those staged objects; with no body, clears
  // all staged files for the staging ID (cancel / submit failure).
  @Delete('set/:id/files')
  @ApiOkResponse({
    description: 'Removes the given staged files, or all staged files for the set',
  })
  @UseGuards(AuthGuard)
  async deleteFiles(
    @Param('id') importSetId: string,
    @Body() body: DeleteImportFilesDTO,
  ): Promise<void> {
    return this.service.deleteFiles(importSetId, body?.s3Paths);
  }

  @Post('set/:id/queue')
  @ApiOkResponse({
    description: 'Creates import_queue records for quartz and queues the set',
  })
  @RoleGuard(
    {
      bodyParam: 'items.*.monPlanId',
      enforceCheckout: true,
      requiredRoles: ['Preparer', 'Submitter', 'Sponsor', 'Initial Authorizer'],
    },
    LookupType.MonitorPlan,
  )
  async queue(
    @Param('id') importSetId: string,
    @Body() body: ImportQueueRequestDTO,
    @User() user: CurrentUser,
  ): Promise<void> {
    return this.service.queue(importSetId, body.items, body.userEmail, user);
  }

  @Post('process')
  @ApiSecurity('ClientId')
  @ApiBearerAuth('ClientToken')
  @UseGuards(ClientTokenGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async process(@Body() params: ProcessImportDTO): Promise<void> {
    void this.processService
      .processImportSet(params.importSetId)
      .catch((err) => {
        Logger.error(
          `processImportSet failed for ${params.importSetId}: ${err?.message}`,
          err?.stack,
          'BulkImportController',
        );
      });
  }

  @Get('latest')
  @ApiOkResponse({
    type: ImportSetDTO,
    description: "The user's most recent submitted import set with its queue rows",
  })
  @UseGuards(AuthGuard)
  async getLatest(@User() user: CurrentUser) {
    return this.service.getLatest(user.userId);
  }

  @Get('set/:id')
  @ApiOkResponse({
    type: ImportSetDTO,
    description: 'An import set with its queue rows',
  })
  @UseGuards(AuthGuard)
  async getSet(@Param('id') importSetId: string) {
    return this.service.getSet(importSetId);
  }
}
