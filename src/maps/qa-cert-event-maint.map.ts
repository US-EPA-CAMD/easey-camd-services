import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { QaCertEventMaintView } from '../entities/qa-cert-event-maint-vw.entity';
import { QaCertEventMaintViewDTO } from '../dto/qa-cert-event-maint-vw.dto';

@Injectable()
export class QaCertEventMaintMap extends BaseMap<
  QaCertEventMaintView,
  QaCertEventMaintViewDTO
> {
  public async one(
    entity: QaCertEventMaintView,
  ): Promise<QaCertEventMaintViewDTO> {
    return {
      id: entity.certEventId,
      locationId: entity.locationId,
      orisCode: entity.orisCode,
      unitStack: entity.unitStack,
      systemIdentifier: entity.systemIdentifier,
      componentIdentifier: entity.componentIdentifier,
      certEventCode: entity.certEventCode,
      certEventDescription: entity.certEventDescription,
      eventDateTime: entity.eventDateTime,
      requiredTestCode: entity.requiredTestCode,
      requiredTestDescription: entity.requiredTestDescription,
      conditionalDateTime: entity.conditionalDateTime,
      lastCompletedDateTime: entity.lastCompletedDateTime,
      submissionAvailabilityCode: entity.submissionAvailabilityCode,
      submissionAvailabilityDescription:
        entity.submissionAvailabilityDescription,
      severityCode: entity.severityCode,
      severityDescription: entity.severityDescription,
      resubExplanation: entity.resubExplanation,
    };
  }
}
