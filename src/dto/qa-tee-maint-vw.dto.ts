import { ApiProperty } from "@nestjs/swagger";
import { propertyMetadata } from "@us-epa-camd/easey-common/constants";

export class QaTeeMaintViewDTO {
  @ApiProperty({
    description: propertyMetadata.testExtensionExemptionId.description,
    example: propertyMetadata.testExtensionExemptionId.example,
    name: propertyMetadata.testExtensionExemptionId.fieldLabels.value,
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
    description: propertyMetadata.emissions.fuelCode.description,
    example: propertyMetadata.emissions.fuelCode.example,
    name: propertyMetadata.emissions.fuelCode.fieldLabels.value,
  })
  fuelCode: string;

  @ApiProperty({
    description: propertyMetadata.emissions.fuelDescription.description,
    example: propertyMetadata.emissions.fuelDescription.example,
    name: propertyMetadata.emissions.fuelDescription.fieldLabels.value,
  })
  fuelDescription: string;

  @ApiProperty({
    description: propertyMetadata.extensionExemptionCode.description,
    example: propertyMetadata.extensionExemptionCode.example,
    name: propertyMetadata.extensionExemptionCode.fieldLabels.value,
  })
  extensionExemptionCode: string;

  @ApiProperty({
    description: propertyMetadata.extensionExemptionDescription.description,
    example: propertyMetadata.extensionExemptionDescription.example,
    name: propertyMetadata.extensionExemptionDescription.fieldLabels.value,
  })
  extensionExemptionDescription: string;

  @ApiProperty({
    description: propertyMetadata.hoursUsed.description,
    example: propertyMetadata.hoursUsed.example,
    name: propertyMetadata.hoursUsed.fieldLabels.value,
  })
  hoursUsed: string;

  @ApiProperty({
    description: propertyMetadata.emissions.spanScaleCode.description,
    example: propertyMetadata.emissions.spanScaleCode.example,
    name: propertyMetadata.emissions.spanScaleCode.fieldLabels.value,
  })
  spanScaleCode: string;

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
