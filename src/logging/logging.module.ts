import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggingController } from './logging.controller';
import { LoggingService } from './logging.service';

@Module({
  imports: [HttpModule],
  controllers: [LoggingController],
  providers: [LoggingService],
})
export class LoggingModule {}
