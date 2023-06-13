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
import { ErrorMessages } from '@us-epa-camd/easey-common/constants';
import { EmissionStatusCode } from '../entities/emission-status-code.entity';
import { SubmissionAvailiblityCode } from '../entities/submission-availiblity-code.entity';
import { SubmissionTypeCode } from '../entities/submission-type-code.entity';
import { ReportingPeriod } from '../entities/reporting-period.entity';
import { MonitorPlan } from '../entities/monitor-plan.entity';

const msgA =
  'The [property] is not valid refer to the list of available [property]s for valid values';

export class EmSubmissionAccessUpdateDTO {
  @ApiProperty()
  @IsString()
  @IsValidCode(EmissionStatusCode, {
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(msgA, {
        property: args.property,
      });
    },
  })
  emissionStatusCode: string;

  @ApiProperty()
  @IsString()
  @IsValidCode(SubmissionAvailiblityCode, {
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(msgA, {
        property: args.property,
      });
    },
  })
  submissionAvailabilityCode: string;

  @ApiProperty()
  @IsString()
  @IsValidCode(SubmissionTypeCode, {
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(msgA, {
        property: args.property,
      });
    },
  })
  submissionTypeCode: string;

  @ApiProperty()
  @IsValidDate({
    message: ErrorMessages.DateValidity(),
  })
  @IsDateString()
  @IsIsoFormat({
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(
        `Ensure [fieldname] is a valid ISO date format of YYYY-MM-DD.`,
        {
          fieldname: args.property,
        },
      );
    },
  })
  closeDate: Date;
}

export class EmSubmissionAccessCreateDTO extends EmSubmissionAccessUpdateDTO {
  @ApiProperty()
  @IsValidDate({
    message: ErrorMessages.DateValidity(),
  })
  @IsDateString()
  @IsIsoFormat({
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(
        `Ensure [fieldname] is a valid ISO date format of YYYY-MM-DD.`,
        {
          fieldname: args.property,
        },
      );
    },
  })
  openDate: Date;

  @ApiProperty()
  @IsString()
  @IsValidCode(MonitorPlan, {
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(
        'The reported a invalid [property].',
        {
          property: args.property,
        },
      );
    },
  })
  monitorPlanId: string;

  @ApiProperty()
  @IsNumber()
  @IsValidCode(ReportingPeriod, {
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(
        'The reported a invalid [property].',
        {
          property: args.property,
        },
      );
    },
  })
  reportingPeriodId: number;
}

export class EmSubmissionAccessDTO extends EmSubmissionAccessCreateDTO {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNumber()
  facilityId: number;

  @ApiProperty()
  @IsNumber()
  orisCode: number;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsString()
  locations: string;

  @ApiProperty()
  @IsString()
  reportingFrequencyCode: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsNumber()
  lastSubmissionId: number;

  @ApiProperty()
  @IsString()
  severityLevel: string;

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsDate()
  addDate: Date;

  @ApiProperty()
  @IsDate()
  updateDate: Date;
}
