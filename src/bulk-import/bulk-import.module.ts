import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { ClientTokenModule } from '../client-token/client-token.module';
import { BulkImportProcessService } from './bulk-import-process.service';
import { BulkImportController } from './bulk-import.controller';
import { BulkImportService } from './bulk-import.service';

@Module({
  imports: [HttpModule, ClientTokenModule],
  controllers: [BulkImportController],
  providers: [BulkImportService, BulkImportProcessService],
})
export class BulkImportModule {}
