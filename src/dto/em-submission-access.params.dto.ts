import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  ValidationArguments,
  IsEnum,
} from 'class-validator';

import { Status } from '../enums/status.enum';
import { Type } from 'class-transformer';
import { Plant } from '../entities/plant.entity';
import { IsValidCode, IsInRange } from '@us-epa-camd/easey-common/pipes';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';

export class EmSubmissionAccessParamsDTO {
  @IsOptional()
  @ApiProperty()
  @IsValidCode(Plant, {
    message: (args: ValidationArguments) => {
      return `The ${args.property} is not valid. Refer to the list of available facilityRecordIds for valid values '/facilities-mgmt/facilities'`;
    },
  })
  @Type(() => Number)
  facilityId?: number;

  @IsOptional()
  @ApiProperty()
  @IsValidCode(MonitorPlan, {
    message: (args: ValidationArguments) => {
      return `The reported ${args.property} is invalid.`;
    },
  })
  monitorPlanId?: string;

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
  @ApiProperty({ enum: Status })
  @IsEnum(Status, {
    message: () => {
      return `The status must have a value of OPEN,PENDING or CLOSED,`;
    },
  })
  status?: string;
}
