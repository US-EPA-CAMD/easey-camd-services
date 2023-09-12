import { Controller, Res, StreamableFile, Get, Query } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CopyOfRecordService } from './copy-of-record.service';
import { ReportParamsDTO } from '../dto/report-params.dto';
import type { Response } from 'express';

@Controller()
@ApiSecurity('APIKey')
@ApiTags('Copy of Record')
export class CopyOfRecordController {
  constructor(private service: CopyOfRecordService) {}

  @Get('copy-of-record')
  generatePdf(
    @Query() params: ReportParamsDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return this.service.getCopyOfRecordPDF(params, res, false);
  }

  @Get('workspace/copy-of-record')
  generatePdfWorkspace(
    @Query() params: ReportParamsDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return this.service.getCopyOfRecordPDF(params, res, true);
  }
}
