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
import { ApiSecurity, ApiTags } from '@nestjs/swagger';

import { RoleGuard, User } from '@us-epa-camd/easey-common/decorators';
import { LookupType } from '@us-epa-camd/easey-common/enums';
import { AuthGuard } from '@us-epa-camd/easey-common/guards';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';

import { ApiExcludeControllerByEnv } from '../decorators/swagger-decorator';
import {
  DeleteImportFilesDTO,
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
  @UseGuards(AuthGuard)
  async createSet(
    @Body('userEmail') userEmail: string,
    @User() user: CurrentUser,
  ): Promise<{ importSetId: string }> {
    return this.service.createSet(user.userId, userEmail);
  }

  @Post('set/:id/stage')
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
  @UseGuards(AuthGuard)
  async deleteFiles(
    @Param('id') importSetId: string,
    @Body() body: DeleteImportFilesDTO,
    @User() user: CurrentUser,
  ): Promise<void> {
    return this.service.deleteFiles(importSetId, body?.s3Paths, user);
  }

  @Post('set/:id/submit')
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
  @UseGuards(AuthGuard)
  async getLatest(@User() user: CurrentUser) {
    return this.service.getLatest(user.userId);
  }

  @Get('set/:id')
  @UseGuards(AuthGuard)
  async getSet(@Param('id') importSetId: string) {
    return this.service.getSet(importSetId);
  }
}
