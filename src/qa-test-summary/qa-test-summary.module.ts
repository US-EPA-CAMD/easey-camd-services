import { Module } from '@nestjs/common';
import { QaTestSummaryService } from './qa-test-summary.service';
import { QaTestSummaryController } from './qa-test-summary.controller';
import { HttpModule } from '@nestjs/axios';
import { QaTestSummaryMaintMap } from '../maps/qa-test-summary-maint.map';

@Module({
  imports: [HttpModule],
  controllers: [QaTestSummaryController],
  providers: [QaTestSummaryService, QaTestSummaryMaintMap],
})
export class QaTestSummaryModule {}
