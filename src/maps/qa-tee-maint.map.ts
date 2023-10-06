import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { QaTeeMaintViewDTO } from '../dto/qa-tee-maint-vw.dto';
import { QaTeeMaintView } from '../entities/qa-tee-maint-vw.entity';

@Injectable()
export class QaTeeMaintMap extends BaseMap<
  QaTeeMaintView,
  QaTeeMaintViewDTO
> {
  public async one(
    entity: QaTeeMaintView,
  ): Promise<QaTeeMaintViewDTO> {
    return {
      id: entity.testExtensionExemptionId,
      locationId: entity.locationId,
      orisCode: entity.orisCode,
      unitStack: entity.unitStack,
      systemIdentifier: entity.systemIdentifier,
      componentIdentifier: entity.componentIdentifier,
      fuelCode: entity.fuelCode,
      fuelDescription: entity.fuelDescription,
      extensionExemptionCode: entity.extensionExemptionCode,
      extensionExemptionDescription: entity.extensionExemptionDescription,
      hoursUsed: entity.hoursUsed,
      spanScaleCode: entity.spanScaleCode,
      submissionAvailabilityCode: entity.submissionAvailabilityCode,
      submissionAvailabilityDescription:
        entity.submissionAvailabilityDescription,
      severityCode: entity.severityCode,
      severityDescription: entity.severityDescription,
      resubExplanation: entity.resubExplanation,
    };
  }
}
