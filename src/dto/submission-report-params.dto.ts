import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  ValidationArguments,
  IsEnum
} from 'class-validator';

import { IsValidCode, IsInRange } from '@us-epa-camd/easey-common/pipes';
import { SeverityCodes } from '../enums/severity-codes.enum';
import { SeverityCode } from '../entities/severity-code.entity';
import { CheckCatalogService } from '@us-epa-camd/easey-common/check-catalog';
import { IsDateHrQtrFormat } from '../pipes/is-date-hr-qtr-format.pipe';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';
import { Plant } from '../entities/plant.entity';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';
import { SubmissionTypeCodes } from '../enums/submission-code.enum';
const msgA =
  'The [property] is not valid refer to the list of available [property]s for valid values';
const msgB = `Ensure [property] are in the following formats Date Range - YYYY-mm-dd /Hour Range- YYYY-mm-dd hh/Quarter Range – YYYY Q1/Q2/Q3/Q4`;

export class SubmissionReportParamsDTO {
 @ApiProperty()
 @IsOptional()
 @IsValidCode(Plant, {
    message: (args: ValidationArguments) => {
    return `The ${args.property} is not valid. Refer to the list of available facilityRecordIds for valid values '/facilities-mgmt/facilities'`;
  },
 },(args: ValidationArguments): FindOneOptions<Plant> => {
     return {
      where: {
         orisCode: args.value,
        },
    };
  })
@Type(() => Number)
orisCode?: number;

@IsOptional()
@ApiProperty()
@IsInRange(1930, currentDateTime().getFullYear(), {
    message: () => {
    return `Ensure the year value is in the range from 1930 to ${currentDateTime().getFullYear()}`;
    },
})
@Type(() => Number)
year?: number;
  
@IsOptional()
@ApiProperty()
@IsInRange(1, 4, {
     message: () => {
      return `Ensure that the Quarter value is a number from 1 to 4.`;
    },
})
@Type(() => Number)
quarter?: number;

@IsOptional()
@ApiProperty({ enum: SeverityCodes })
@IsString()
@IsValidCode(SeverityCode, {
   message: (args: ValidationArguments) => {
    return CheckCatalogService.formatMessage(msgA, {
      property: args.property,
      value: args.value,
    });
 },
})
severityCode?: string;


@IsOptional()
@ApiProperty({ enum: SubmissionTypeCodes })
@IsString()
@IsEnum(SubmissionTypeCodes, {
    message: () => {
      return `The status must have a value of EM, MP, QA, or MATS`;
    },
  })
submissionType?: string;

@IsOptional()
@ApiProperty()
@IsString()
@IsDateHrQtrFormat({
 message: (args: ValidationArguments) => {
    return CheckCatalogService.formatMessage(msgB, {
     property: args.property,
    });
 },
})
submissionFrom?: string;

@IsOptional()
@ApiProperty()
@IsString()
@IsDateHrQtrFormat({
 message: (args: ValidationArguments) => {
    return CheckCatalogService.formatMessage(msgB, {
      property: args.property,
      });
    },
})
submissionTo?: string;
}
