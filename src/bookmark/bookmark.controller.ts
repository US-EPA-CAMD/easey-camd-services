import {
  ApiTags,
  ApiOkResponse,
  ApiSecurity,
} from '@nestjs/swagger';

import { Controller, Get, Post } from '@nestjs/common';

import { BookmarkService } from './bookmark.service';

@ApiSecurity('APIKey')
@ApiTags('Bookmarks')
@Controller()
export class BookmarkController {
  constructor(private service: BookmarkService) {}

  @Get(':id')
  @ApiOkResponse({
    description: 'Retrieves a bookmark by its id',
  })
  async getBookmark() {
    return "get bookmark";
  }

  @Post()
  @ApiOkResponse({
    description: 'Creates a bookmark record',
  })
  async createBookmark() {
    return "create bookmark";
  }
}
