import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportParameterMap } from 'src/maps/report-parameter.map';
import { ReportDetailMap } from './../maps/report-detail.map';
import { ReportColumnMap } from 'src/maps/report-column.map';
import { ReportRepository } from './report.repository';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportMap } from './../maps/report.map';

@Module({
  imports: [TypeOrmModule.forFeature([ReportRepository])],
  controllers: [ReportController],
  providers: [
    ReportMap,
    ReportService,
    ReportDetailMap,
    ReportColumnMap,
    ReportParameterMap,    
  ],
  exports: [TypeOrmModule],
})
export class ReportModule {}
