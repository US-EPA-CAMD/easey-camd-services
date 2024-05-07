import { EntityManager, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { Bookmark } from '../entities/bookmark.entity';

@Injectable()
export class BookmarkRepository extends Repository<Bookmark> {
  constructor(entityManager: EntityManager) {
    super(Bookmark, entityManager);
  }
}
