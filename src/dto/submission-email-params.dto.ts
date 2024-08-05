import { SubmissionSet } from '../entities/submission-set.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import { SeverityCode } from '../entities/severity-code.entity';
import { ReportingPeriod } from '../entities/reporting-period.entity';

export class SubmissionEmailParamsDto {

  processCode           : string;
  submissionSet         : SubmissionSet;
  submissionRecords     : SubmissionQueue [];
  highestSeverityRecord : HighestSeverityRecord;

  //Facility Information
  rptPeriod             : ReportingPeriod; //For EM records only
  monLocationIds        : string;   //Comma separated list
  facilityName          : string;
  orisCode              : string;
  stateCode             : string;
  unitStackPipe         : string;

  templateContext: any = {};

  toEmail: string;
  ccEmail : string;
  fromEmail: string;
  subjectEmail: string;
  isSubmissionFailure: boolean;
  submissionError: string;

  constructor(init?: Partial<SubmissionEmailParamsDto>) {
    Object.assign(this, init);
  }
}

export interface HighestSeverityRecord {
  submissionQueue: SubmissionQueue | null;
  severityCode: SeverityCode | null;
}

export function isCritical1Severity(record: HighestSeverityRecord): boolean {
  return record?.submissionQueue?.severityCode?.toUpperCase() === 'CRIT1';
}

export function isResubmissionRequired(record: HighestSeverityRecord): boolean {
  return record?.submissionQueue?.severityCode?.toUpperCase() === 'CRIT1' || record?.submissionQueue?.severityCode?.toUpperCase() === 'CRIT2';
}

export type KeyValuePairs = {
  [key: string]: string | { label: string; url: string };
};

