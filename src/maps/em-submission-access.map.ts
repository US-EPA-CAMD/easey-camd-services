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

    if (
      entity?.emissionStatusCode === 'APPRVD' &&
      (entity?.submissionAvailabilityCode === 'GRANTED' ||
        entity?.submissionAvailabilityCode === 'REQUIRE' ||
        entity?.submissionAvailabilityCode === null)
    ) {
      status = 'OPEN';
    } else if (
      entity?.emissionStatusCode === 'PENDING' &&
      (entity?.submissionAvailabilityCode === 'GRANTED' ||
        entity?.submissionAvailabilityCode === 'REQUIRE' ||
        entity?.submissionAvailabilityCode === null)
    ) {
      status = 'PENDING';
    } else if (
      entity?.emissionStatusCode === 'RECVD' ||
      entity?.submissionAvailabilityCode === 'DELETE' ||
      entity?.submissionAvailabilityCode === 'CRITERR' ||
      entity?.submissionAvailabilityCode === 'NOTSUB'
    ) {
      status = 'CLOSED';
    }
    return {
      id: entity.id,
      facilityId: entity?.facilityId,
      facilityName: entity?.facilityName,
      orisCode: entity?.orisCode,
      monitorPlanId: entity?.monitorPlanId,
      state: entity?.state,
      locations: entity?.locations,
      reportingPeriodId: entity?.reportingPeriodId,
      reportingFrequencyCode: entity?.reportingFrequencyCode,
      reportingPeriodAbbreviation: entity?.reportingPeriodAbbreviation,
      status: status,
      openDate: entity?.openDate,
      closeDate: entity?.closeDate,
      emissionStatusCode: entity?.emissionStatusCode ?? null,
      emissionStatusDescription: entity?.emissionStatusDescription ?? null,
      submissionAvailabilityCode: entity?.submissionAvailabilityCode ?? null,
      submissionAvailabilityDescription: entity?.submissionTypeDescription ?? null,
      lastSubmissionId: entity?.lastSubmissionId,
      submissionTypeDescription: entity?.submissionTypeDescription ?? null,
      submissionTypeCode: entity?.submissionTypeCode ?? null,
      severityLevel: entity?.severityLevel,
      resubExplanation: entity?.resubExplanation,
      userid: entity?.userid,
      addDate: entity?.addDate,
      updateDate: entity?.updateDate,
    };
  }
}
