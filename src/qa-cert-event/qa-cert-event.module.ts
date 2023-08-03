import { Module } from '@nestjs/common';
import { QaCertEventService } from './qa-cert-event.service';
import { QaCertEventController } from './qa-cert-event.controller';
import { HttpModule } from '@nestjs/axios';
import { QaCertEventMaintMap } from '../maps/qa-cert-event-maint.map';

@Module({
  imports: [HttpModule],
  controllers: [QaCertEventController],
  providers: [QaCertEventService, QaCertEventMaintMap],
})
export class QaCertEventModule {}
