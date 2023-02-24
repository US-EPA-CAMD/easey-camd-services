import { Routes } from 'nest-router';

import { BulkFileModule } from './bulk-file/bulk-file.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { LoggingModule } from './logging/logging.module';
import { MailModule } from './mail/mail.module';

const routes: Routes = [
  {
    path: '/bookmarks',
    module: BookmarkModule,
  },
  {
    path: '/bulk-files',
    module: BulkFileModule,
  },
  {
    path: '/support',
    module: MailModule,
  },
  {
    path: '/logging',
    module: LoggingModule,
  },
];

export default routes;
