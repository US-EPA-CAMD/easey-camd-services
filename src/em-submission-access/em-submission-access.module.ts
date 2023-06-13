import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmSubmissionAccessViewRepository } from './em-submission-access-view.repository';
import { EmSubmissionAccessController } from './em-submission-access.controller';
import { EmSubmissionAccessService } from './em-submission-access.service';
import { EmSubmissionAccessMap } from '../maps/em-submission-access.map';
import { EmSubmissionAccessRepository } from './em-submission-access.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmSubmissionAccessViewRepository]),
    TypeOrmModule.forFeature([EmSubmissionAccessRepository]),
    HttpModule,
  ],
  controllers: [EmSubmissionAccessController],
  providers: [ConfigService, EmSubmissionAccessService, EmSubmissionAccessMap],
  exports: [TypeOrmModule],
})
export class EmSubmissionAccessModule {}
