import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { ClientTokenService } from './client-token.service';

@Module({
  imports: [HttpModule],
  providers: [ClientTokenService],
  exports: [ClientTokenService],
})
export class ClientTokenModule {}
