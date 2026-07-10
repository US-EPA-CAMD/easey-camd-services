import { Module } from '@nestjs/common';

import { BulkImportController } from './bulk-import.controller';
import { BulkImportService } from './bulk-import.service';

@Module({
  controllers: [BulkImportController],
  providers: [BulkImportService],
})
export class BulkImportModule {}
