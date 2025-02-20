import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { EmSubmissionAccessDTO } from '../dto/em-submission-access.dto';
import { EmSubmissionAccessView } from '../entities/em-submission-access-vw.entity';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';

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
      entity?.submissionAvailabilityCode === 'GRANTED' || 
      entity?.submissionAvailabilityCode === 'REQUIRE'
    ) {
      status = 'OPEN';
    } else if (
      entity?.emissionStatusCode === 'PENDING'
    ) {
      status = 'PENDING';
    } else if (
      (entity?.emissionStatusCode === null && entity?.closeDate < currentDateTime()) ||
      (entity?.emissionStatusCode !== 'PENDING' && !['GRANTED','REQUIRE', 'DELETE'].includes(entity?.submissionAvailabilityCode))
    ) {
      status = 'CLOSED';
    } else if (
      entity?.submissionAvailabilityCode === 'DELETE'
    ) {
      status = 'CANCELLED';
    } else if (
      entity?.submissionAvailabilityCode === null &&
      entity?.closeDate >= currentDateTime()
    ) {
      status = 'NOT YET OPEN';
    } //status 'NO WINDOW' will be handled seperately
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
