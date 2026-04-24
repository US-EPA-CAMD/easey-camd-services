import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  ValidationArguments,
  IsEnum, IsNotEmpty,
} from 'class-validator';

import { Status } from '../enums/status.enum';
import { Type } from 'class-transformer';
import { Plant } from '../entities/plant.entity';
import { IsValidCode, IsInRange, IsInYearRange } from '@us-epa-camd/easey-common/pipes';
import {FindOneOptions} from "typeorm/find-options/FindOneOptions";

export class EmSubmissionAccessParamsDTO {
  @ApiProperty()
  @IsNotEmpty({message: () => 'Facility is required'})
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
  orisCode: number;

  @IsNotEmpty({message: () => 'Year is required'})
  @ApiProperty()
  @IsInYearRange(1930, null, {
    message: () => {
      return `Ensure the year value is in the range from 1930 to ${new Date().getFullYear()}`;
    },
  })
  @Type(() => Number)
  year: number;

  @IsNotEmpty({message: () => 'Quarter is required'})
  @ApiProperty()
  @IsInRange(1, 4, {
    message: () => {
      return `Ensure that the Quarter value is a number from 1 to 4.`;
    },
  })
  @Type(() => Number)
  quarter: number;

  @IsOptional()
  @ApiProperty({ enum: Status })
  @IsEnum(Status, {
    message: () => {
      return `The status must have a value of OPEN, PENDING, CLOSED, CANCELLED, NO WINDOW, or NOT YET OPEN`;
    },
  })
  status?: string;
}
