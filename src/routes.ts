import { Routes } from 'nest-router';

import { BulkFileModule } from './bulkFile/bulk-file.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { LoggingModule } from './logging/logging.module';
import { ReportModule } from './report/report.module';
import { ReportWorkspaceModule } from './report-workspace/report.module';
import { MailModule } from './mail/mail.module';
import { ErrorSuppressionsModule } from './error-suppressions/error-suppressions.module';

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
    path: '/workspace/reports',
    module: ReportWorkspaceModule,
  },
  {
    path: '/error-suppressions',
    module: ErrorSuppressionsModule,
  },
];

export default routes;
