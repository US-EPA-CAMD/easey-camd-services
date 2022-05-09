import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { Controller, Get, Post } from '@nestjs/common';

import { BulkFileService } from './bulk_file.service';

@ApiSecurity('APIKey')
@ApiTags('Bulk Files')
//@ApiExtraModels(BookmarkCreatedDTO)
@Controller()
export class BulkFileController {
  constructor(private service: BulkFileService) {}

  @Get('bulk-files')
  @ApiOkResponse({
    description:
      'Retrieves a list of bulk data files and their metadata from S3',
  })
  async getBulkFiles() {
    return this.service.getBulkDataFiles();
  }

  @Post('metadata/bulk-file')
  @ApiOkResponse({
    description: 'Posts a new database metadata entry for an S3 file',
  })
  async postBulkFileMetadata() {
    return 'get bookmark';
  }
}
