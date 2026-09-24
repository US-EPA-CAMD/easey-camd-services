import { BulkFileModule } from './bulk-file/bulk-file.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { LoggingModule } from './logging/logging.module';
import { ReportModule } from './report/report.module';
import { ReportWorkspaceModule } from './report-workspace/report.module';
import { MailModule } from './mail/mail.module';
import { ErrorSuppressionsModule } from './error-suppressions/error-suppressions.module';
import { SubmissionReportModule } from './submission-report/submission-report.module';
import { AdminModule } from './admin/admin.module';
import { QaMaintenanceModule } from './qa-maintenance/qa-maintenance.module';
import { QaTestSummaryModule } from './qa-test-summary/qa-test-summary.module';
import { QaCertEventModule } from './qa-cert-event/qa-cert-event.module';
import { QaTestExtensionExemptionModule } from './qa-test-extension-exemption/qa-test-extension-exemption.module';
import { EmSubmissionAccessModule } from './em-submission-access/em-submission-access.module';
import { SubmissionModule } from './submission/submission.module';
import { MatsFileUploadModule } from './mats-file-upload/mats-file-upload.module';
import { BulkImportModule } from './bulk-import/bulk-import.module';
import { TestTypeCodeModule } from './test-type-code/test-type-code.module';
import { HealthModule } from '@us-epa-camd/easey-common/health/health.module';
import { UnitsExpectedToSubmitModule } from './units-expected-to-submit/units-expected-to-submit.module';

const routes = [
  {
    path: '/health',
    module: HealthModule,
  },
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
    path: '/submission',
    module: SubmissionModule,
  },
  {
    path: '/mats-file-upload',
    module: MatsFileUploadModule,
  },
  {
    path: '/bulk-import',
    module: BulkImportModule,
  },
  {
    path: '/',
    module: TestTypeCodeModule,
  },
  {
    path: '/admin',
    module: AdminModule,
    children: [
      {
        path: '/qa-maintenance',
        module: QaMaintenanceModule,
        children: [
          {
            path: '/test-summary',
            module: QaTestSummaryModule,
          },
          {
            path: '/cert-events',
            module: QaCertEventModule,
          },
          {
            path: '/extension-exemptions',
            module: QaTestExtensionExemptionModule,
          },
        ],
      },
      {
        path: '/em-submission-access',
        module: EmSubmissionAccessModule,
      },
      {
        path: '/error-suppressions',
        module: ErrorSuppressionsModule,
      },
      {
        path: '/submission-report',
        module: SubmissionReportModule,
      },
      {
        path: '/units-expected-to-submit',
        module: UnitsExpectedToSubmitModule,
      },
    ],
  },
];

export default routes;
