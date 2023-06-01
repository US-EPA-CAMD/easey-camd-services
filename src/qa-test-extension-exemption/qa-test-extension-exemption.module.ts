import { Module } from '@nestjs/common';
import { QaTestExtensionExemptionService } from './qa-test-extension-exemption.service';
import { QaTestExtensionExemptionController } from './qa-test-extension-exemption.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [QaTestExtensionExemptionController],
  providers: [QaTestExtensionExemptionService]
})
export class QaTestExtensionExemptionModule {}
