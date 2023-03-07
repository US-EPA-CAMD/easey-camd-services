import { Module } from '@nestjs/common';

import { DataSetService } from '../dataset/dataset.service';
import { DataSetModule } from '../dataset/dataset.module';
import { ReportController } from './report.controller';

@Module({
  imports: [DataSetModule],
  controllers: [ReportController],
  providers: [DataSetService],
  exports: [],
})
export class ReportModule {}
