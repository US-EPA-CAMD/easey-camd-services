import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { ReportModule } from '../report/report.module';
import { ReportWorkspaceController } from './report.controller';
import { ReportService } from '../report/report.service';

@Module({
  imports: [
    HttpModule,
    ReportModule,
  ],
  controllers: [ReportWorkspaceController],
  providers: [ReportService],
  exports: [],
})
export class ReportWorkspaceModule {}
