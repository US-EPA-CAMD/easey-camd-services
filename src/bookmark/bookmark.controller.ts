import {
  ApiTags,
  ApiOkResponse,
  ApiSecurity,
  ApiExtraModels,
} from '@nestjs/swagger';

import { Controller, Get, Post, Body } from '@nestjs/common';

import { BookmarkService } from './bookmark.service';
import { BoomarkPayloadDTO } from '../dto/bookmark-payload.dto';
import { BookmarkCreatedDTO } from '../dto/bookmark-created.dto';

@ApiSecurity('APIKey')
@ApiTags('Bookmarks')
@ApiExtraModels(BookmarkCreatedDTO)
@Controller()
export class BookmarkController {
  constructor(private service: BookmarkService) {}

  @Get(':id')
  @ApiOkResponse({
    description: 'Retrieves a bookmark by its id',
  })
  async getBookmark() {
    return 'get bookmark';
  }

  @Post()
  @ApiOkResponse({
    description: 'Creates a bookmark record',
  })
  async createBookmark(
    @Body() payload: BoomarkPayloadDTO,
  ): Promise<BookmarkCreatedDTO> {
    return this.service.createBookmark(payload);
  }
}
