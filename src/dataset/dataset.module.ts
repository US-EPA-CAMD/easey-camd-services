import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataSetRepository } from './dataset.repository';
import { DataSetService } from './dataset.service';

@Module({
  imports: [TypeOrmModule.forFeature([DataSetRepository])],
  controllers: [],
  providers: [DataSetService],
  exports: [TypeOrmModule, DataSetService],
})
export class DataSetModule {}
