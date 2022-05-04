import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'camdaux.bookmark' })
export class Bookmark extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'bookmark_id',
  })
  bookmarkId: number;

  @Column({
    name: 'bookmark_data',
  })
  bookmarkData: string;

  @Column({
    name: 'bookmark_add_date',
  })
  bookmarkAddDate: Date;

  @Column({
    name: 'bookmark_last_accessed_date',
  })
  bookmarklastAccessedDate: Date;

  @Column({
    name: 'bookmark_hit_count',
  })
  bookmarkHitCount: number;
}
