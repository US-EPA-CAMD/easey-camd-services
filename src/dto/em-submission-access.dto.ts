import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNumber,
  IsString,
  ValidationArguments,
  IsDateString,
} from 'class-validator';
import { IsIsoFormat } from '@us-epa-camd/easey-common/pipes/is-iso-format.pipe';
import { CheckCatalogService } from '@us-epa-camd/easey-common/check-catalog';
import { IsValidCode, IsValidDate } from '@us-epa-camd/easey-common/pipes';
import {
  ErrorMessages,
  propertyMetadata,
} from '@us-epa-camd/easey-common/constants';
import { EmissionStatusCode } from '../entities/emission-status-code.entity';
import { SubmissionAvailiblityCode } from '../entities/submission-availiblity-code.entity';
import { ReportingPeriod } from '../entities/reporting-period.entity';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { IsValidCloseDate } from '../pipes/is-valid-close-date.pipe';

const msgA =
  'The [property] is not valid refer to the list of available [property]s for valid values';

export class EmSubmissionAccessUpdateDTO {
  @ApiProperty({
    description: propertyMetadata.emissionStatusCode.description,
    example: propertyMetadata.emissionStatusCode.example,
    name: propertyMetadata.emissionStatusCode.fieldLabels.value,
  })
  @IsString()
  @IsValidCode(EmissionStatusCode, {
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(msgA, {
        property: args.property,
      });
    },
  })
  emissionStatusCode: string;

  @ApiProperty({
    description: propertyMetadata.submissionAvailabilityCode.description,
    example: propertyMetadata.submissionAvailabilityCode.example,
    name: propertyMetadata.submissionAvailabilityCode.fieldLabels.value,
  })
  @IsString()
  @IsValidCode(SubmissionAvailiblityCode, {
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(msgA, {
        property: args.property,
      });
    },
  })
  submissionAvailabilityCode: string;

  @ApiProperty({
    description: propertyMetadata.resubExplanation.description,
    example: propertyMetadata.resubExplanation.example,
    name: propertyMetadata.resubExplanation.fieldLabels.value,
  })
  @IsString()
  resubExplanation: string;

  @ApiProperty({
    description: propertyMetadata.closeDate.description,
    example: propertyMetadata.closeDate.example,
    name: propertyMetadata.closeDate.fieldLabels.value,
  })
  @IsValidDate({
    message: ErrorMessages.DateValidity(),
  })
  @IsDateString()
  @IsIsoFormat({
    message: (args: ValidationArguments) => {
      return `Ensure ${args.property} is a valid ISO date format of YYYY-MM-DD.`;
    },
  })
  @IsValidCloseDate()
  closeDate: Date;
}

export class EmSubmissionAccessCreateDTO extends EmSubmissionAccessUpdateDTO {
  @ApiProperty({
    description: propertyMetadata.openDate.description,
    example: propertyMetadata.openDate.example,
    name: propertyMetadata.openDate.fieldLabels.value,
  })
  @IsValidDate({
    message: ErrorMessages.DateValidity(),
  })
  @IsDateString()
  @IsIsoFormat({
    message: (args: ValidationArguments) => {
      return `Ensure ${args.property} is a valid ISO date format of YYYY-MM-DD.`;
    },
  })
  openDate: Date;

  @ApiProperty({
    description: propertyMetadata.monitorPlanReportingFreqDTOPlanId.description,
    example: propertyMetadata.monitorPlanReportingFreqDTOPlanId.example,
    name: propertyMetadata.monitorPlanReportingFreqDTOPlanId.fieldLabels.value,
  })
  @IsString()
  @IsValidCode(MonitorPlan, {
    message: (args: ValidationArguments) => {
      return `The reported ${args.property} is invalid.`;
    },
  })
  monitorPlanId: string;

  @ApiProperty({
    description: propertyMetadata.emissions.reportingPeriodId.description,
    example: propertyMetadata.emissions.reportingPeriodId.example,
    name: propertyMetadata.emissions.reportingPeriodId.fieldLabels.value,
  })
  @IsNumber()
  @IsValidCode(ReportingPeriod, {
    message: (args: ValidationArguments) => {
      return `The reported ${args.property} is invalid.`;
    },
  })
  reportingPeriodId: number;
}

export class EmSubmissionAccessDTO extends EmSubmissionAccessCreateDTO {
  @ApiProperty({
    description: propertyMetadata.emSubmissionId.description,
    example: propertyMetadata.emSubmissionId.example,
    name: propertyMetadata.emSubmissionId.fieldLabels.value,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: propertyMetadata.facilityId.description,
    example: propertyMetadata.facilityId.example,
    name: propertyMetadata.facilityId.fieldLabels.value,
  })
  @IsNumber()
  facilityId: number;

  @ApiProperty({
    description: propertyMetadata.facilityName.description,
    example: propertyMetadata.facilityName.example,
    name: propertyMetadata.facilityName.fieldLabels.value,
  })
  @IsString()
  facilityName: string;

  @ApiProperty({
    description: propertyMetadata.monitorPlanDTOOrisCode.description,
    example: propertyMetadata.monitorPlanDTOOrisCode.example,
    name: propertyMetadata.monitorPlanDTOOrisCode.fieldLabels.value,
  })
  @IsNumber()
  orisCode: number;

  @ApiProperty({
    description: propertyMetadata.state.description,
    example: propertyMetadata.state.example,
    name: propertyMetadata.state.fieldLabels.value,
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: propertyMetadata.emSubmissionLocations.description,
    example: propertyMetadata.emSubmissionLocations.example,
    name: propertyMetadata.emSubmissionLocations.fieldLabels.value,
  })
  @IsString()
  locations: string;

  @ApiProperty({
    description: propertyMetadata.reportingFrequencyCode.description,
    example: propertyMetadata.reportingFrequencyCode.example,
    name: propertyMetadata.reportingFrequencyCode.fieldLabels.value,
  })
  @IsString()
  reportingFrequencyCode: string;

  @ApiProperty({
    description: propertyMetadata.reportingPeriodAbbreviation.description,
    example: propertyMetadata.reportingPeriodAbbreviation.example,
    name: propertyMetadata.reportingPeriodAbbreviation.fieldLabels.value,
  })
  @IsString()
  reportingPeriodAbbreviation: string;

  @ApiProperty({
    description: propertyMetadata.submissionTypeDescription.description,
    example: propertyMetadata.submissionTypeDescription.example,
    name: propertyMetadata.submissionTypeDescription.fieldLabels.value,
  })
  @IsString()
  submissionTypeDescription: string;

  @ApiProperty({
    description: propertyMetadata.emissionStatusCode.description,
    example: propertyMetadata.emissionStatusCode.example,
    name: propertyMetadata.emissionStatusCode.fieldLabels.value,
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: propertyMetadata.lastSubmissionId.description,
    example: propertyMetadata.lastSubmissionId.example,
    name: propertyMetadata.lastSubmissionId.fieldLabels.value,
  })
  @IsNumber()
  lastSubmissionId: number;

  @ApiProperty({
    description: propertyMetadata.severityLevel.description,
    example: propertyMetadata.severityLevel.example,
    name: propertyMetadata.severityLevel.fieldLabels.value,
  })
  @IsString()
  severityLevel: string;

  @ApiProperty({
    description: propertyMetadata.emissions.userId.description,
    example: propertyMetadata.emissions.userId.example,
    name: propertyMetadata.emissions.userId.fieldLabels.value,
  })
  @IsString()
  userid: string;

  @ApiProperty({
    description: propertyMetadata.emissions.addDate.description,
    example: propertyMetadata.emissions.addDate.example,
    name: propertyMetadata.emissions.addDate.fieldLabels.value,
  })
  @IsDate()
  addDate: Date;

  @ApiProperty({
    description: propertyMetadata.emissions.updateDate.description,
    example: propertyMetadata.emissions.updateDate.example,
    name: propertyMetadata.emissions.updateDate.fieldLabels.value,
  })
  @IsDate()
  updateDate: Date;
}
