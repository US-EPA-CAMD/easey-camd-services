import { v4 } from 'uuid';
import { Request } from 'express';

import {
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
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientTokenGuard } from '@us-epa-camd/easey-common/guards';

import { BulkFileDTO } from '../dto/bulk_file.dto';
import { BulkFileService } from './bulk-file.service';
import { BulkFileInputDTO } from '../dto/bulk_file_input.dto';
import { BulkFileCopyParamsDTO } from '../dto/bulk-file-copy.params.dto';

@Controller()
@ApiSecurity('APIKey')
@ApiTags('Bulk Files')
export class BulkFileController {
  constructor(
    private service: BulkFileService,
  ) {}

  @Get()
  @ApiOkResponse({
    isArray: true,
    type: BulkFileDTO,
    description: 'Retrieves a list of bulk data files and their metadata from S3',
  })
  async getBulkFiles(
    @Req() req: Request,
  ): Promise<BulkFileDTO[]> {
    const curDate = new Date();
    curDate.setDate(curDate.getDate() + 1);
    curDate.setHours(8, 0, 0, 0);
    req.res.removeHeader('Pragma');
    req.res.setHeader('Cache-Control', 'Public');    
    req.res.setHeader('Expires', curDate.toUTCString());
    return this.service.getBulkDataFiles();
  }

  @Post('gaftp-copy')
  @ApiOkResponse({
    description: 'Copies files from GAFTP to S3',
  })
  @ApiSecurity('ClientId')
  @ApiBearerAuth('ClientToken')
  @UseGuards(ClientTokenGuard)
  async copyBulkFiles(@Query() params: BulkFileCopyParamsDTO) {
    const job_id = v4();

    this.service.copyBulkFiles(params, job_id);
    return job_id;
  }

  @Post('metadata')
  @ApiOkResponse({
    type: BulkFileDTO,
    description: 'Creates metadata for bulk files store in S3',
  })
  @ApiSecurity('ClientId')
  @ApiBearerAuth('ClientToken')
  @UseGuards(ClientTokenGuard)
  async addBulkFile(
    @Body() bulkDataFile: BulkFileInputDTO
  ): Promise<BulkFileDTO> {
    return this.service.addBulkDataFile(bulkDataFile);
  }

  @Put('metadata/:filePath')
  @ApiOkResponse({
    type: BulkFileDTO,
    description: 'Updates metadata for bulk files store in S3',
  })
  @ApiSecurity('ClientId')
  @ApiBearerAuth('ClientToken')
  @UseGuards(ClientTokenGuard)
  async updateBulkFile(
    @Param('s3Path') s3Path: string,
    @Body() bulkDataFile: BulkFileInputDTO,
  ): Promise<BulkFileDTO> {
    return this.service.updateBulkDataFile(s3Path, bulkDataFile);
  }
}
