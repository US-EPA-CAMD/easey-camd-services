import { Module } from '@nestjs/common';
import { QaMaintenanceModule } from '../qa-maintenance/qa-maintenance.module';

@Module({
  imports: [QaMaintenanceModule],
  controllers: [],
  providers: [],
})
export class AdminModule {}
