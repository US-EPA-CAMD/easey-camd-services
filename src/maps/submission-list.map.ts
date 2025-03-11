import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { EmSubmissionAccessDTO } from '../dto/em-submission-access.dto';
import { EmSubmissionAccessView } from '../entities/em-submission-access-vw.entity';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';
import { SubmissionReportDTO } from '../dto/submission-report.dto';
import { SubmissionListView } from 'src/entities/submission-list-vw.entity';

@Injectable()
export class SubmissionListMap extends BaseMap<
SubmissionListView,
SubmissionReportDTO
> {
  public async one(
    entity: SubmissionListView,
  ): Promise<SubmissionReportDTO> {
    
    return {
        orisCode :  entity?.orisCode,
        facilityName :  entity?.facilityName,
        state :  entity?.state,
        locations :  entity?.locations,
        reportingPeriodAbbreviation :  entity?.reportingPeriod,
        reportingFrequencyCode :  entity?.reportingFrequencyCode,
        submissionTypeCode :  entity?.submissionTypeCode,
        submissionId :  entity?.submissionId,
        submissionDateTime :  entity?.submissionDateTime,
        severityLevel :  entity?.severityLevel,
        mostRecet :  entity?.mostRecet,
        submissionCode :  entity?.submissionStatus,
        severityCode :  entity?.severityCode,
        criticalErrLevelOne :  entity?.criticalErrLevelOne,
        criticalErrLevelTwo :  entity?.criticalErrLevelTwo,
        nonCritical :  entity?.nonCritical,
        infoMessage :  entity?.infoMessage,
        adminOverride :  entity?.adminOverride,
        submitter :  entity?.submitter
    };
  }
}
