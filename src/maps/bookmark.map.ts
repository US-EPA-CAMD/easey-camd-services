import { Injectable } from '@nestjs/common';

import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { Bookmark } from '../entities/bookmark.entity';
import { BookmarkDTO } from '../dto/bookmark.dto';

@Injectable()
export class BookmarkMap extends BaseMap<Bookmark, BookmarkDTO> {
  public async one(entity: Bookmark): Promise<BookmarkDTO> {
    return {
      bookmarkId: entity.bookmarkId,
      bookmarkData: JSON.parse(entity.bookmarkData),
      bookmarkAddDate: entity.bookmarkAddDate,
      bookmarkLastAccessedDate: entity.bookmarkLastAccessedDate,
      bookmarkHitCount: entity.bookmarkHitCount,
    };
  }
}
