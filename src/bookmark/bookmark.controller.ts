import {
  ApiTags,
  ApiOkResponse,
  ApiSecurity,
  ApiExtraModels,
} from '@nestjs/swagger';

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import {
  BadRequestResponse,
  NotFoundResponse,
} from '../utils/swagger-decorator.const';
import { BookmarkService } from './bookmark.service';
import { BoomarkPayloadDTO } from '../dto/bookmark-payload.dto';
import { BookmarkCreatedDTO } from '../dto/bookmark-created.dto';
import { BookmarkDTO } from '../dto/bookmark.dto';

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
  @BadRequestResponse()
  @NotFoundResponse()
  async getBookmarkById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BookmarkDTO> {
    return this.service.getBookmarkById(id);
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
