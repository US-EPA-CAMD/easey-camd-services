import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidationArguments, IsEnum } from 'class-validator';

import { Status } from '../enums/status.enum';
import { Type } from 'class-transformer';
import { Plant } from '../entities/plant.entity';
import { IsValidCode, IsInRange } from '@us-epa-camd/easey-common/pipes';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { CheckCatalogService } from '@us-epa-camd/easey-common/check-catalog';
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
      return CheckCatalogService.formatMessage(
        'The reported a invalid [property].',
        {
          property: args.property,
        },
      );
    },
  })
  monitorPlanId?: string;

  @IsOptional()
  @ApiProperty()
  @IsInRange(1930, currentDateTime().getFullYear(), {
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(
        `You reported an invalid year of [value]. Year must be a numeric number from 1930 to ${currentDateTime().getFullYear()}.`,
        {
          value: args.value,
        },
      );
    },
  })
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @ApiProperty()
  @IsInRange(1, 4, {
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(
        `You reported an invalid quarter of [value]. Quarter must be a numeric number from 1 to 4.`,
        {
          value: args.value,
        },
      );
    },
  })
  @Type(() => Number)
  quarter?: number;

  @IsOptional()
  @ApiProperty({ enum: Status })
  @IsEnum(Status, {
    message: () => {
      return CheckCatalogService.formatMessage(
        `You reported an invalid status. Status must be OPEN,PENDING or CLOSED,`,
      );
    },
  })
  status?: string;
}
