import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportRepository } from './report.repository';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([ReportRepository])
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [TypeOrmModule],
})
export class ReportModule {}
