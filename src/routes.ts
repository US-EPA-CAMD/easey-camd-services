import { Routes } from 'nest-router';

import { BulkFileModule } from './bulkFile/bulk-file.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { LoggingModule } from './logging/logging.module';
import { ReportModule } from './report/report.module';
import { MailModule } from './mail/mail.module';
import { SubmissionModule } from './submission/submission.module';

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
  {
    path: '/reports',
    module: ReportModule,
  },
  {
    path: '/submit',
    module: SubmissionModule,
  },
];

export default routes;
