import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { UnitsExpectedRepository } from './units-expected-to-submit.repository';
import { UnitsExpectedToSubmitController } from './units-expected-to-submit.controller';
import { UnitsExpectedToSubmitService } from './units-expected-to-submit.service';
import { UnitsExpectedMap } from '../maps/units-expected.map';

@Module({
  imports: [
    TypeOrmModule.forFeature([UnitsExpectedRepository]),
    HttpModule,
    LoggerModule,
  ],
  controllers: [UnitsExpectedToSubmitController],
  providers: [
    ConfigService,
    UnitsExpectedRepository,
    UnitsExpectedToSubmitService,
    UnitsExpectedMap,
  ],
  exports: [TypeOrmModule],
})
export class UnitsExpectedToSubmitModule {}