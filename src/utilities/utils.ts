import { dateToEstString } from '@us-epa-camd/easey-common/utilities/functions';

import { QaMaintenanceAction } from '../enums/admin-actions.enum';
import { QaType } from '../enums/qa-type.enum';
import { QaCertEventMaintView } from '../entities/qa-cert-event-maint-vw.entity';

export function formatQaCertEventMaintenanceLogMessage(
  record: QaCertEventMaintView,
  action: QaMaintenanceAction,
  userId: string,
  timestamp: Date,
) {
  const data = {
    'Cert Event Code': record.certEventCode,
    'Conditional Date/Time': dateToEstString(record.conditionalDateTime),
    'Event Date/Time': dateToEstString(record.eventDateTime),
    'Facility ORIS': record.orisCode,
    'Last Completed Date/Time': dateToEstString(record.lastCompletedDateTime),
    'MP Location': record.locationId,
    'Required Test Code': record.requiredTestCode,
    'Resubmission Reason': record.resubExplanation,
    'Severity Description': record.severityDescription,
    'Submission Availability Description':
      record.submissionAvailabilityDescription,
    'System/Component ID':
      record.systemIdentifier ?? record.componentIdentifier,
    'Unit/StackPipe ID': record.unitStack,
  };
  return formatQaMaintenanceLogMessage({
    action,
    data,
    qaType: QaType.CERT_EVENT,
    timestamp,
    userId,
  });
}

export function formatQaMaintenanceLogMessage({
  action,
  data,
  qaType,
  timestamp,
  userId,
}: {
  action: QaMaintenanceAction;
  data: Record<string, string | number>;
  qaType: QaType;
  timestamp: Date;
  userId: string;
}): [string, Record<string, string | number>] {
  return [
    `QA/Cert ${qaType} ${
      action === QaMaintenanceAction.DELETE
        ? 'deleted'
        : 'resubmission required'
    } by ${userId} on ${dateToEstString(timestamp)}:`,
    data,
  ];
}
