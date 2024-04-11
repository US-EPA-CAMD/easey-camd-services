import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataSet } from '../entities/dataset.entity';
import { DataSetRepository } from './dataset.repository';
import { DataSetService } from './dataset.service';

@Module({
  imports: [TypeOrmModule.forFeature([DataSet])],
  controllers: [],
  providers: [DataSetRepository, DataSetService],
  exports: [TypeOrmModule, DataSetRepository, DataSetService],
})
export class DataSetModule {}
