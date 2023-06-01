import { Module } from '@nestjs/common';
import { QaTestDataService } from './qa-test-data.service';
import { QaTestDataController } from './qa-test-data.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [QaTestDataController],
  providers: [QaTestDataService],
})
export class QaTestDataModule {}
