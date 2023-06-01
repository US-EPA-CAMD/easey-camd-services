import { Module } from '@nestjs/common';
import { QaCertEventModule } from '../qa-cert-event/qa-cert-event.module';
import { QaTestExtensionExemptionModule } from '../qa-test-extension-exemption/qa-test-extension-exemption.module';
import { QaTestDataModule } from '../qa-test-data/qa-test-data.module';

@Module({
  imports: [
    QaTestDataModule,
    QaCertEventModule,
    QaTestExtensionExemptionModule,
  ],
  controllers: [],
  providers: [],
})
export class QaMaintenanceModule {}
