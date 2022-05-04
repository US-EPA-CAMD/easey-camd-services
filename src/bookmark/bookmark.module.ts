import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookmarkController } from './bookmark.controller';
import { BookmarkService } from './bookmark.service';
import { BookmarkRepository } from './bookmark.repository';
@Module({
  imports: [TypeOrmModule.forFeature([BookmarkRepository])],
  controllers: [BookmarkController],
  providers: [ConfigService, BookmarkService],
  exports: [TypeOrmModule],
})
export class BookmarkModule {}
