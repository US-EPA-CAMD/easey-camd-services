import { ApiProperty } from '@nestjs/swagger';
import { propertyMetadata } from '@us-epa-camd/easey-common';

export class UnitsExpectedDTO {
  @ApiProperty({
    description: propertyMetadata.facilityId.description,
    example: propertyMetadata.facilityId.example,
  })
  facilityId: number;

  @ApiProperty({
    description: propertyMetadata.facilityName.description,
    example: propertyMetadata.facilityName.example,
  })
  facilityName: string;

  @ApiProperty({
    description: propertyMetadata.stateCode.description,
    example: propertyMetadata.stateCode.example,
  })
  stateCode: string;

  @ApiProperty({
    description: propertyMetadata.unitId.description,
    example: propertyMetadata.unitId.example,
  })
  unitId: string;

  @ApiProperty({
    description: propertyMetadata.monitorLocationDTOId.description,
    example: propertyMetadata.monitorLocationDTOId.example,

  })
  locations: string;

  @ApiProperty({
    description: propertyMetadata.submissionTypeDescription.description,
    example: propertyMetadata.submissionTypeDescription.example,
  })
  submissionTypeDescription: string;

  @ApiProperty({
    description:propertyMetadata.beginDate.description,
    example: propertyMetadata.beginDate.example,
  })
  accessBeginDate: Date;

  @ApiProperty({
    description: propertyMetadata.endDate.description,
    example: propertyMetadata.endDate.example,
  })
  accessEndDate: Date;

  @ApiProperty({
    description: 'Window Status',
    example: 'Open',
  })
  windowStatus: string;

  @ApiProperty({
    description: propertyMetadata.submissionAvailabilityCode.description,
    example:  propertyMetadata.submissionAvailabilityCode.example,
  })
  submissionStatus: string;

  @ApiProperty({
    description: 'Submission ID',
    example: 12345,
  })
  submissionId: number;

  @ApiProperty({
    description: propertyMetadata.date.description,
    example: propertyMetadata.date.example,
  })
  submissionDate: Date;

  @ApiProperty({
    description: propertyMetadata.severityDescription.description,
    example: propertyMetadata.severityDescription.example,
  })
  severityDescription: string;
}