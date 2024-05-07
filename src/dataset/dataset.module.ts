import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataSetRepository } from './dataset.repository';
import { DataSetService } from './dataset.service';

@Module({
  imports: [TypeOrmModule.forFeature([DataSetRepository])],
  controllers: [],
  providers: [DataSetRepository, DataSetService],
  exports: [TypeOrmModule, DataSetRepository, DataSetService],
})
export class DataSetModule {}
