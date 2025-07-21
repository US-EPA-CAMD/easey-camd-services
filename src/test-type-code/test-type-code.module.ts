import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TestTypeCodeController } from './test-type-code.controller';
import { TestTypeCodeService } from './test-type-code.service';

@Module({
  imports: [HttpModule],
  controllers: [TestTypeCodeController],
  providers: [TestTypeCodeService],
})
export class TestTypeCodeModule {}
