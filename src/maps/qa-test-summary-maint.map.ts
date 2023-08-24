import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { QaTestSummaryMaintViewDTO } from '../dto/qa-test-summary-maint-vw.dto';
import { QaTestSummaryMaintView } from '../entities/qa-test-summary-maint-vw.entity';

@Injectable()
export class QaTestSummaryMaintMap extends BaseMap<
  QaTestSummaryMaintView,
  QaTestSummaryMaintViewDTO
> {
  public async one(
    entity: QaTestSummaryMaintView,
  ): Promise<QaTestSummaryMaintViewDTO> {
    return {
      testSumId: entity.testSumId,
      locationId: entity.locationId,
      orisCode: entity.orisCode,
      unitStack: entity.unitStack,
      systemIdentifier: entity.systemIdentifier,
      componentIdentifier: entity.componentIdentifier,
      testNumber: entity.testNumber,
      gracePeriodIndicator: entity.gracePeriodIndicator,
      testTypeCode: entity.testTypeCode,
      testReasonCode: entity.testReasonCode,
      testResultCode: entity.testResultCode,
      yearQuarter: entity.yearQuarter,
      testDescription: entity.testDescription,
      beginDateTime: entity.beginDateTime,
      endDateTime: entity.endDateTime,
      testComment: entity.testComment,
      spanScaleCode: entity.spanScaleCode,
      injectionProtocolCode: entity.injectionProtocolCode,
      submissionAvailabilityCode: entity.submissionAvailabilityCode,
      submissionAvailabilityDescription:
        entity.submissionAvailabilityDescription,
      severityCode: entity.severityCode,
      severityDescription: entity.severityDescription,
      resubExplanation: entity.resubExplanation,
    };
  }
}
