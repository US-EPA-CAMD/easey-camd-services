import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { RoleGuard, User } from '@us-epa-camd/easey-common/decorators';
import { LookupType } from '@us-epa-camd/easey-common/enums';
import { AuthGuard } from '@us-epa-camd/easey-common/guards';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';

import { ApiExcludeControllerByEnv } from '../decorators/swagger-decorator';
import {
  CreateImportSetResponseDTO,
  DeleteImportFilesDTO,
  ImportSetDTO,
  StagedFileDTO,
  SubmitImportDTO,
} from '../dto/bulk-import.dto';
import { BulkImportService } from './bulk-import.service';

@Controller()
@ApiTags('Bulk Import')
@ApiSecurity('APIKey')
@ApiExcludeControllerByEnv()
export class BulkImportController {
  constructor(private readonly service: BulkImportService) {}

  @Post('set')
  @ApiOkResponse({
    type: CreateImportSetResponseDTO,
    description: 'Creates a new import set in the NEW state',
  })
  @UseGuards(AuthGuard)
  async createSet(
    @Body('userEmail') userEmail: string,
    @User() user: CurrentUser,
  ): Promise<CreateImportSetResponseDTO> {
    return this.service.createSet(user.userId, userEmail);
  }

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
    @User() user: CurrentUser,
  ): Promise<StagedFileDTO[]> {
    return this.service.stageFiles(importSetId, files, user);
  }

  // With a body of s3Paths, removes those staged objects; with no body, clears
  // all staged files for the set (cancel / submit failure). The NEW row is kept.
  @Delete('set/:id/files')
  @ApiOkResponse({
    description: 'Removes the given staged files, or all staged files for the set',
  })
  @UseGuards(AuthGuard)
  async deleteFiles(
    @Param('id') importSetId: string,
    @Body() body: DeleteImportFilesDTO,
    @User() user: CurrentUser,
  ): Promise<void> {
    return this.service.deleteFiles(importSetId, body?.s3Paths, user);
  }

  @Post('set/:id/submit')
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
  async submit(
    @Param('id') importSetId: string,
    @Body() body: SubmitImportDTO,
    @User() user: CurrentUser,
  ): Promise<void> {
    return this.service.submit(importSetId, body.items, user);
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
