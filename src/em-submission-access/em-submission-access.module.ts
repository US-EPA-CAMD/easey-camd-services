import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmSubmissionAccessMap } from '../maps/em-submission-access.map';
import { EmSubmissionAccessViewRepository } from './em-submission-access-view.repository';
import { EmSubmissionAccessController } from './em-submission-access.controller';
import { EmSubmissionAccessRepository } from './em-submission-access.repository';
import { EmSubmissionAccessService } from './em-submission-access.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmSubmissionAccessViewRepository]),
    TypeOrmModule.forFeature([EmSubmissionAccessRepository]),
    HttpModule,
  ],
  controllers: [EmSubmissionAccessController],
  providers: [
    ConfigService,
    EmSubmissionAccessRepository,
    EmSubmissionAccessViewRepository,
    EmSubmissionAccessService,
    EmSubmissionAccessMap,
  ],
  exports: [TypeOrmModule],
})
export class EmSubmissionAccessModule {}
