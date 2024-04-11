import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';

import { BookmarkRepository } from './bookmark.repository';
import { BoomarkPayloadDTO } from '../dto/bookmark-payload.dto';
import { BookmarkCreatedDTO } from '../dto/bookmark-created.dto';
import { BookmarkDTO } from '../dto/bookmark.dto';
import { BookmarkMap } from '../maps/bookmark.map';

@Injectable()
export class BookmarkService {
  constructor(
    @InjectRepository(BookmarkRepository)
    private readonly repository: BookmarkRepository,
    private readonly bookmarkMap: BookmarkMap,
    private readonly logger: Logger,
  ) {}

  async createBookmark(
    payload: BoomarkPayloadDTO,
  ): Promise<BookmarkCreatedDTO> {
    if (Object.keys(payload).length !== 0) {
      const bookmarkEntity = this.repository.create({
        bookmarkData: JSON.stringify(payload),
        bookmarkAddDate: new Date(),
        bookmarkLastAccessedDate: null,
        bookmarkHitCount: 0,
      });

      const bookmark = await this.repository.save(bookmarkEntity);

      const bookmarkCreated: BookmarkCreatedDTO = {
        bookmarkId: bookmark.bookmarkId,
        bookmarkAddDate: bookmark.bookmarkAddDate,
      };

      return bookmarkCreated;
    } else {
      throw new BadRequestException(
        'Payload should not be null, undefined, or empty',
      );
    }
  }

  async getBookmarkById(id: number): Promise<BookmarkDTO> {
    const results = await this.repository.findOneBy({ bookmarkId: id });
    if (results === undefined) {
      throw new NotFoundException('Bookmark id does not exist');
    }

    await this.repository.update(id, {
      bookmarkLastAccessedDate: new Date(),
      bookmarkHitCount: results.bookmarkHitCount + 1,
    });

    let updatedResults = await this.repository.findOneBy({ bookmarkId: id });

    return this.bookmarkMap.one(updatedResults);
  }
}
