import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionListViewRepository } from './submission-report.repository';
import { SubmissionReportController } from './submission-report.controller';
import { SubmissionReportService } from './submission-report.service';
import { SubmissionListMap } from 'src/maps/submission-list.map';

@Module({
  imports: [
   TypeOrmModule.forFeature([SubmissionListViewRepository]),
    HttpModule
  ],
  controllers: [SubmissionReportController],
  providers: [
    ConfigService,
    SubmissionListViewRepository,
    SubmissionReportService,
    SubmissionListMap
  ],
  exports: [TypeOrmModule],
})
export class SubmissionReportModule {}
