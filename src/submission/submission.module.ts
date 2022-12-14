import { Module } from '@nestjs/common';
import SubmissionBuilder from './submission-builder.service';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';

@Module({
  imports: [],
  controllers: [SubmissionController],
  providers: [SubmissionService, SubmissionBuilder],
})
export class SubmissionModule {}
