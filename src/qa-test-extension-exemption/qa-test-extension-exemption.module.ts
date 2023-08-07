import { Module } from '@nestjs/common';
import { QaTestExtensionExemptionService } from './qa-test-extension-exemption.service';
import { QaTestExtensionExemptionController } from './qa-test-extension-exemption.controller';
import { HttpModule } from '@nestjs/axios';
import { QaTeeMaintMap } from '../maps/qa-tee-maint.map';

@Module({
  imports: [HttpModule],
  controllers: [QaTestExtensionExemptionController],
  providers: [QaTestExtensionExemptionService, QaTeeMaintMap],
})
export class QaTestExtensionExemptionModule {}
