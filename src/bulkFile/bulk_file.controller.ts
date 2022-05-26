import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';

import { BulkFileService } from './bulk_file.service';

import { BulkFileInputDTO } from 'src/dto/bulk_file_input.dto';

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

  @Post('bulk-files')
  @ApiOkResponse({
    type: BulkFileInputDTO,
    description: 'Posts a new database entry for an S3 file'
  })
  async postBulkFile(@Body() bulkDataFile: BulkFileInputDTO) {
    return this.service.postBulkDataFile(bulkDataFile);
  }

  @Put('bulk-files/:id')
  @ApiOkResponse({
    type: BulkFileInputDTO,
    description: 'Puts new information for a database entry for an S3 file'
  })
  async putBulkFile(@Param('id') id: number, @Body() bulkDataFile: BulkFileInputDTO) {
    return this.service.putBulkDataFile(id, bulkDataFile);
  }

}
