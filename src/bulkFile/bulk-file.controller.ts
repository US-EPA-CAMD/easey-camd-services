import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { BulkFileService } from './bulk-file.service';
import { BulkFileInputDTO } from 'src/dto/bulk_file_input.dto';
import { BulkFileCopyParamsDTO } from 'src/dto/bulk-file-copy.params.dto';
import { ClientTokenGuard } from '@us-epa-camd/easey-common/guards';

@ApiSecurity('APIKey')
@ApiTags('Bulk Files')
//@ApiExtraModels(BookmarkCreatedDTO)
@Controller()
export class BulkFileController {
  constructor(private service: BulkFileService) {}

  @Get()
  @ApiOkResponse({
    description:
      'Retrieves a list of bulk data files and their metadata from S3',
  })
  async getBulkFiles() {
    return this.service.getBulkDataFiles();
  }

  @Post('gaftp-copy')
  @ApiOkResponse({
    description: 'Copies a list of files from GAFTP to S3',
  })
  @ApiBearerAuth('ClientToken')
  @ApiSecurity('ClientId')
  @UseGuards(ClientTokenGuard)
  async copyBulkFiles(@Query() params: BulkFileCopyParamsDTO) {
    return this.service.copyBulkFiles(params);
  }

  @Post('metadata')
  @ApiOkResponse({
    type: BulkFileInputDTO,
    description: 'Adds a new database entry for an S3 file',
  })
  @ApiBearerAuth('ClientToken')
  @ApiSecurity('ClientId')
  @UseGuards(ClientTokenGuard)
  async addBulkFile(@Body() bulkDataFile: BulkFileInputDTO) {
    return this.service.addBulkDataFile(bulkDataFile);
  }

  @Put('metadata/:filePath')
  @ApiOkResponse({
    type: BulkFileInputDTO,
    description: 'Updates a database entry for an S3 file',
  })
  @ApiBearerAuth('ClientToken')
  @ApiSecurity('ClientId')
  @UseGuards(ClientTokenGuard)
  async updateBulkFile(
    @Param('s3_path') s3_path: string,
    @Body() bulkDataFile: BulkFileInputDTO,
  ) {
    return this.service.updateBulkDataFile(s3_path, bulkDataFile);
  }
}
