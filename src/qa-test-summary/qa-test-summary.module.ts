import { Module } from '@nestjs/common';
import { QaTestSummaryService } from './qa-test-summary.service';
import { QaTestSummaryController } from './qa-test-summary.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [QaTestSummaryController],
  providers: [QaTestSummaryService],
})
export class QaTestSummaryModule {}
