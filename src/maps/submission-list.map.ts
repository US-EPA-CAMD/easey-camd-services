import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { SubmissionReportDTO } from '../dto/submission-report.dto';
import { SubmissionListView } from 'src/entities/submission-list-vw.entity';
import { format } from 'date-fns';

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
        identifyingInformation :  entity?.identifyingInformation,
        reportingFrequencyCode :  entity?.reportingFrequencyCode,
        submissionTypeCode :  entity?.submissionTypeCode,
        submissionId :  entity?.submissionId,
        submissionDateTime : entity?.submissionDateTime
        ? format(new Date(entity.submissionDateTime), 'yyyy-MM-dd HH:mm:ss')
        : null,
        severityLevel :  entity?.severityLevel,
        mostRecent :  entity?.mostRecent,
        submissionStatus :  entity?.submissionStatus,
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
