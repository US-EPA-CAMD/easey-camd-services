import { ApiProperty } from '@nestjs/swagger';
import { propertyMetadata } from '@us-epa-camd/easey-common/constants';

export class QaCertEventMaintViewDTO {
  @ApiProperty({
    description: propertyMetadata.qaCertificationEventId.description,
    example: propertyMetadata.qaCertificationEventId.example,
    name: propertyMetadata.qaCertificationEventId.fieldLabels.value,
  })
  certEventId: string;
  
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
    description: propertyMetadata.certEventCode.description,
    example: propertyMetadata.certEventCode.example,
    name: propertyMetadata.certEventCode.fieldLabels.value,
  })
  certEventCode: string;
  
  @ApiProperty({
    description: propertyMetadata.certEventDescription.description,
    example: propertyMetadata.certEventDescription.example,
    name: propertyMetadata.certEventDescription.fieldLabels.value,
  })
  certEventDescription: string;
  
  @ApiProperty({
    description: propertyMetadata.eventDateTime.description,
    example: propertyMetadata.eventDateTime.example,
    name: propertyMetadata.eventDateTime.fieldLabels.value,
  })
  eventDateTime: string;
  
  @ApiProperty({
    description: propertyMetadata.requiredTestCode.description,
    example: propertyMetadata.requiredTestCode.example,
    name: propertyMetadata.requiredTestCode.fieldLabels.value,
  })
  requiredTestCode: string;
  
  @ApiProperty({
    description: propertyMetadata.requiredTestDescription.description,
    example: propertyMetadata.requiredTestDescription.example,
    name: propertyMetadata.requiredTestDescription.fieldLabels.value,
  })
  requiredTestDescription: string;
  
  @ApiProperty({
    description: propertyMetadata.conditionalDateTime.description,
    example: propertyMetadata.conditionalDateTime.example,
    name: propertyMetadata.conditionalDateTime.fieldLabels.value,
  })
  conditionalDateTime: string;
  
  @ApiProperty({
    description: propertyMetadata.lastCompletedDateTime.description,
    example: propertyMetadata.lastCompletedDateTime.example,
    name: propertyMetadata.lastCompletedDateTime.fieldLabels.value,
  })
  lastCompletedDateTime: string;
  
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
