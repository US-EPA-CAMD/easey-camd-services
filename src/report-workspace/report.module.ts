import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { DataSetService } from '../dataset/dataset.service';
import { DataSetModule } from '../dataset/dataset.module';
import { ReportWorkspaceController } from './report.controller';

@Module({
  imports: [HttpModule, DataSetModule],
  controllers: [ReportWorkspaceController],
  providers: [DataSetService],
  exports: [],
})
export class ReportWorkspaceModule {}
