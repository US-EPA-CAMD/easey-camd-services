import { EntityRepository, Repository } from 'typeorm';
import { Bookmark } from '../entities/bookmark.entity';

@EntityRepository(Bookmark)
export class BookmarkRepository extends Repository<Bookmark> {}
