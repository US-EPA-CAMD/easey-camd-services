import { Routes } from 'nest-router';

import { BookmarkModule } from './bookmark/bookmark.module';

const routes: Routes = [
  {
    path: '/bookmarks',
    module: BookmarkModule,
  },
];

export default routes;
