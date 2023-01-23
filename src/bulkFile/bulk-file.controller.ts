import { Request } from 'express';

import {
  ApiExcludeEndpoint,
  ApiBearerAuth,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import {
  Controller,
  Get,
  Req,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ClientTokenGuard } from '@us-epa-camd/easey-common/guards';

import { BulkFileDTO } from '../dto/bulk_file.dto';
import { BulkFileService } from './bulk-file.service';
import { BulkFileInputDTO } from '../dto/bulk_file_input.dto';

@Controller()
@ApiSecurity('APIKey')
@ApiTags('Bulk Files')
export class BulkFileController {
  constructor(private service: BulkFileService) {}

  @Get()
  @ApiOkResponse({
    isArray: true,
    type: BulkFileDTO,
    description:
      'Retrieves a list of bulk data files and their metadata from S3',
  })
  async getBulkFiles(@Req() req: Request): Promise<BulkFileDTO[]> {
    const curDate = new Date();
    curDate.setDate(curDate.getDate() + 1);
    curDate.setHours(8, 0, 0, 0);
    req.res.removeHeader('Pragma');
    req.res.setHeader('Cache-Control', 'Public');
    req.res.setHeader('Expires', new Date(curDate).toUTCString());
    return this.service.getBulkDataFiles();
  }

  @Post('metadata')
  @ApiOkResponse({
    type: BulkFileDTO,
    description: 'Creates metadata for bulk files store in S3',
  })
  @ApiExcludeEndpoint()
  @ApiSecurity('ClientId')
  @ApiBearerAuth('ClientToken')
  @UseGuards(ClientTokenGuard)
  async addBulkFile(
    @Body() bulkDataFile: BulkFileInputDTO,
  ): Promise<BulkFileDTO> {
    return this.service.addBulkDataFile(bulkDataFile);
  }
}
