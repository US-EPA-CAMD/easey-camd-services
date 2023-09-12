import { Controller, Res, StreamableFile } from '@nestjs/common';
import { Get, Query } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CopyOfRecordService } from './copy-of-record.service';
import { ReportParamsDTO } from '../dto/report-params.dto';
import type { Response } from 'express';

@Controller()
@ApiSecurity('APIKey')
@ApiTags('Copy of Record')
export class CopyOfRecordController {
  constructor(private service: CopyOfRecordService) {}

  @Get()
  generatePdf(
    @Query() params: ReportParamsDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return this.service.getCopyOfRecordPDF(params, res);
  }
}
