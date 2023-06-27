import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { EmSubmissionAccessDTO } from '../dto/em-submission-access.dto';
import { EmSubmissionAccessView } from '../entities/em-submission-access-vw.entity';

@Injectable()
export class EmSubmissionAccessMap extends BaseMap<
  EmSubmissionAccessView,
  EmSubmissionAccessDTO
> {
  public async one(
    entity: EmSubmissionAccessView,
  ): Promise<EmSubmissionAccessDTO> {
    let status: string;
    //need to add a condition when submissionAvailabilityCode is not REQUIRE or GRANTED
    if (
      entity?.emissionStatusCode === 'APPRVD' &&
      entity?.submissionAvailabilityCode === ('REQUIRE' || 'GRANTED')
    ) {
      status = 'OPEN';
    } else if (entity?.emissionStatusCode === 'PENDING') {
      status = 'PENDING';
    } else if (entity?.emissionStatusCode === 'RCVD') {
      status = 'CLOSED';
    }
    return {
      id: entity.id,
      facilityId: entity?.facilityId,
      orisCode: entity?.orisCode,
      monitorPlanId: entity?.monitorPlanId,
      state: entity?.state,
      locations: entity?.locations,
      reportingPeriodId: entity?.reportingPeriodId,
      reportingFrequencyCode: entity?.reportingFrequencyCode,
      status: status,
      openDate: entity?.openDate,
      closeDate: entity?.closeDate,
      emissionStatusCode: entity?.emissionStatusCode,
      submissionAvailabilityCode: entity?.submissionAvailabilityCode,
      lastSubmissionId: entity?.lastSubmissionId,
      submissionTypeCode: entity?.submissionTypeCode,
      severityLevel: entity?.severityLevel,
      resubExplanation: entity?.resubExplanation,
      userid: entity?.userid,
      addDate: entity?.addDate,
      updateDate: entity?.updateDate,
    };
  }
}
