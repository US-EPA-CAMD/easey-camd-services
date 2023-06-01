import { Routes } from 'nest-router';

import { BulkFileModule } from './bulk-file/bulk-file.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { LoggingModule } from './logging/logging.module';
import { ReportModule } from './report/report.module';
import { ReportWorkspaceModule } from './report-workspace/report.module';
import { MailModule } from './mail/mail.module';
import { ErrorSuppressionsModule } from './error-suppressions/error-suppressions.module';
import { AdminModule } from './admin/admin.module';
import { QaMaintenanceModule } from './qa-maintenance/qa-maintenance.module';
import { QaTestDataModule } from './qa-test-data/qa-test-data.module';
import { QaCertEventModule } from './qa-cert-event/qa-cert-event.module';
import { QaTestExtensionExemptionModule } from './qa-test-extension-exemption/qa-test-extension-exemption.module';

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
    path: '/admin',
    module: AdminModule,
    children: [
      {
        path: '/qa-certification',
        module: QaMaintenanceModule,
        children: [
          {
            path: '/test-data',
            module: QaTestDataModule
          },
          {
            path: '/cert-events',
            module: QaCertEventModule
          },
          {
            path: '/extension-exemptions',
            module: QaTestExtensionExemptionModule
          },
        ]
      },
      {
        path: '/error-suppressions',
        module: ErrorSuppressionsModule,
      },
    ]
  },
];

export default routes;
