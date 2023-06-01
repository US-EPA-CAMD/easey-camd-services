import { Module } from '@nestjs/common';
import { QaCertEventService } from './qa-cert-event.service';
import { QaCertEventController } from './qa-cert-event.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports:[HttpModule],
  controllers: [QaCertEventController],
  providers: [QaCertEventService]
})
export class QaCertEventModule {}
