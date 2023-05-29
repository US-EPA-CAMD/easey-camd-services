import { Module } from '@nestjs/common';
import { QaCertEventModule } from '../qa-cert-event/qa-cert-event.module';
import { QaTestExtensionExemptionModule } from '../qa-test-extension-exemption/qa-test-extension-exemption.module';
import { QaTestSummaryModule } from '../qa-test-summary/qa-test-summary.module';

@Module({
  imports: [
    QaTestSummaryModule,
    QaCertEventModule,
    QaTestExtensionExemptionModule,
  ],
  controllers: [],
  providers: [],
})
export class QaMaintenanceModule {}
