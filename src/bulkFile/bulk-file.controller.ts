import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';

import { BulkFileService } from './bulk-file.service';

import { BulkFileInputDTO } from 'src/dto/bulk_file_input.dto';
import { BulkFileCopyParamsDTO } from 'src/dto/bulk-file-copy.params.dto';

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

  @Post('gaftp-copy/bulk-files')
  @ApiOkResponse({
    description: 'Copies a list of files from GAFTP to S3',
  })
  async copyBulkFiles(@Query() params: BulkFileCopyParamsDTO) {
    return this.service.copyBulkFiles(params);
  }

  /*
  @Post('metadata/bulk-file')
  @ApiOkResponse({
    description: 'Posts a new database metadata entry for an S3 file',
  })
  async postBulkFileMetadata() {
    return 'get bookmark';
  }
  */
  @Post('metadata/bulk-files')
  @ApiOkResponse({
    type: BulkFileInputDTO,
    description: 'Adds a new database entry for an S3 file',
  })
  async addBulkFile(@Body() bulkDataFile: BulkFileInputDTO) {
    return this.service.addBulkDataFile(bulkDataFile);
  }

  @Put('metadata/bulk-files/:s3_path')
  @ApiOkResponse({
    type: BulkFileInputDTO,
    description: 'Updates a database entry for an S3 file',
  })
  async updateBulkFile(
    @Param('s3_path') s3_path: string,
    @Body() bulkDataFile: BulkFileInputDTO,
  ) {
    return this.service.updateBulkDataFile(s3_path, bulkDataFile);
  }
}
