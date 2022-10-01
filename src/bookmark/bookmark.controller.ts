import {
  ApiTags,
  ApiOkResponse,
  ApiSecurity,
  ApiBearerAuth,
} from '@nestjs/swagger';

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ClientTokenGuard } from '@us-epa-camd/easey-common/guards';

import { BookmarkService } from './bookmark.service';
import { BoomarkPayloadDTO } from '../dto/bookmark-payload.dto';
import { BookmarkCreatedDTO } from '../dto/bookmark-created.dto';
import { BookmarkDTO } from '../dto/bookmark.dto';

@Controller()
@ApiSecurity('APIKey')
@ApiTags('Bookmarks')
export class BookmarkController {
  constructor(private service: BookmarkService) {}

  @Get(':id')
  @ApiOkResponse({
    type: BookmarkDTO,
    description: 'Retrieves a CAMD application bookmark by its id',
  })
  async getBookmarkById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BookmarkDTO> {
    return this.service.getBookmarkById(id);
  }

  @Post()
  @ApiSecurity('ClientId')
  @ApiBearerAuth('ClientToken')
  @UseGuards(ClientTokenGuard)
  @ApiOkResponse({
    type: BookmarkCreatedDTO,
    description: 'Creates a bookmark for CAMD applications',
  })
  async createBookmark(
    @Body() payload: BoomarkPayloadDTO,
  ): Promise<BookmarkCreatedDTO> {
    return this.service.createBookmark(payload);
  }
}
