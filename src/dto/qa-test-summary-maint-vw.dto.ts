import { ApiProperty } from "@nestjs/swagger";
import { propertyMetadata } from "@us-epa-camd/easey-common/constants";

export class QaTestSummaryMaintViewDTO {
  
  @ApiProperty({
    description: propertyMetadata.testSummaryId.description,
    example: propertyMetadata.testSummaryId.example,
    name: propertyMetadata.testSummaryId.fieldLabels.value,
  })
  id: string;
  
  @ApiProperty({
    description: propertyMetadata.emissions.monitoringLocationId.description,
    example: propertyMetadata.emissions.monitoringLocationId.example,
    name: propertyMetadata.emissions.monitoringLocationId.fieldLabels.value,
  })
  locationId: string;
  
  @ApiProperty({
    description: propertyMetadata.monitorPlanDTOOrisCode.description,
    example: propertyMetadata.monitorPlanDTOOrisCode.example,
    name: propertyMetadata.monitorPlanDTOOrisCode.fieldLabels.value,
  })
  orisCode: number;
  
  @ApiProperty({
    description: propertyMetadata.stackPipeId.description,
    example: propertyMetadata.stackPipeId.example,
    name: propertyMetadata.stackPipeId.fieldLabels.value,
  })
  unitStack: string;
  
  @ApiProperty({
    description: propertyMetadata.monitorSystemDTOMonitoringSystemId.description,
    example: propertyMetadata.monitorSystemDTOMonitoringSystemId.example,
    name: propertyMetadata.monitorSystemDTOMonitoringSystemId.fieldLabels.value,
  })
  systemIdentifier: string;
  
  @ApiProperty({
    description: propertyMetadata.systemComponentDTOComponentId.description,
    example: propertyMetadata.systemComponentDTOComponentId.example,
    name: propertyMetadata.systemComponentDTOComponentId.fieldLabels.value,
  })
  componentIdentifier: string;
  
  @ApiProperty({
    description: propertyMetadata.testNumber.description,
    example: propertyMetadata.testNumber.example,
    name: propertyMetadata.testNumber.fieldLabels.value,
  })
  testNumber: string;
  
  @ApiProperty({
    description: propertyMetadata.gracePeriodIndicator.description,
    example: propertyMetadata.gracePeriodIndicator.example,
    name: propertyMetadata.gracePeriodIndicator.fieldLabels.value,
  })
  gracePeriodIndicator: number;
  
  @ApiProperty({
    description: propertyMetadata.testTypeCode.description,
    example: propertyMetadata.testTypeCode.example,
    name: propertyMetadata.testTypeCode.fieldLabels.value,
  })
  testTypeCode: string;
  
  @ApiProperty({
    description: propertyMetadata.testReasonCode.description,
    example: propertyMetadata.testReasonCode.example,
    name: propertyMetadata.testReasonCode.fieldLabels.value,
  })
  testReasonCode: string;
  
  @ApiProperty({
    description: propertyMetadata.testResultCode.description,
    example: propertyMetadata.testResultCode.example,
    name: propertyMetadata.testResultCode.fieldLabels.value,
  })
  testResultCode: string;
  
  @ApiProperty({
    description: propertyMetadata.reportingPeriodAbbreviation.description,
    example: propertyMetadata.reportingPeriodAbbreviation.example,
    name: propertyMetadata.reportingPeriodAbbreviation.fieldLabels.value,
  })
  yearQuarter: string;
  
  @ApiProperty({
    description: propertyMetadata.testExtensionExemptionId.description,
    example: propertyMetadata.testExtensionExemptionId.example,
    name: propertyMetadata.testExtensionExemptionId.fieldLabels.value,
  })
  testDescription: string;
  
  @ApiProperty({
    description: propertyMetadata.beginDateTime.description,
    example: propertyMetadata.beginDateTime.example,
    name: propertyMetadata.beginDateTime.fieldLabels.value,
  })
  beginDateTime: string;
  
  @ApiProperty({
    description: propertyMetadata.endDateTime.description,
    example: propertyMetadata.endDateTime.example,
    name: propertyMetadata.endDateTime.fieldLabels.value,
  })
  endDateTime: string;
  
  @ApiProperty({
    description: propertyMetadata.testComment.description,
    example: propertyMetadata.testComment.example,
    name: propertyMetadata.testComment.fieldLabels.value,
  })
  testComment: string;
  
  @ApiProperty({
    description: propertyMetadata.emissions.spanScaleCode.description,
    example: propertyMetadata.emissions.spanScaleCode.example,
    name: propertyMetadata.emissions.spanScaleCode.fieldLabels.value,
  })
  spanScaleCode: string;
  
  @ApiProperty({
    description: propertyMetadata.emissions.injectionProtocolCode.description,
    example: propertyMetadata.emissions.injectionProtocolCode.example,
    name: propertyMetadata.emissions.injectionProtocolCode.fieldLabels.value,
  })
  injectionProtocolCode: string;
  
  @ApiProperty({
    description: propertyMetadata.submissionAvailabilityCode.description,
    example: propertyMetadata.submissionAvailabilityCode.example,
    name: propertyMetadata.submissionAvailabilityCode.fieldLabels.value,
  })
  submissionAvailabilityCode: string;
  
  @ApiProperty({
    description: propertyMetadata.submissionAvailabilityDescription.description,
    example: propertyMetadata.submissionAvailabilityDescription.example,
    name: propertyMetadata.submissionAvailabilityDescription.fieldLabels.value,
  })
  submissionAvailabilityDescription: string;
  
  @ApiProperty({
    description: propertyMetadata.severityCode.description,
    example: propertyMetadata.severityCode.example,
    name: propertyMetadata.severityCode.fieldLabels.value,
  })
  severityCode: string;
  
  @ApiProperty({
    description: propertyMetadata.severityDescription.description,
    example: propertyMetadata.severityDescription.example,
    name: propertyMetadata.severityDescription.fieldLabels.value,
  })
  severityDescription: string;
  
  @ApiProperty({
    description: propertyMetadata.resubExplanation.description,
    example: propertyMetadata.resubExplanation.example,
    name: propertyMetadata.resubExplanation.fieldLabels.value,
  })
  resubExplanation: string;
}
