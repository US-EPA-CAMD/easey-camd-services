import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, ValidationArguments } from 'class-validator';
import { Plant } from '../entities/plant.entity';
import { IsValidCode } from '@us-epa-camd/easey-common/pipes';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';

export class QaCertMaintParamsDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'orisCode is required' })
  @IsValidCode(
    Plant,
    {
      message: (args: ValidationArguments) => {
        return `The ${args.property} is not valid. Refer to the list of available facilityIds for valid values '/facilities-mgmt/facilities'`;
      },
    },
    (args: ValidationArguments): FindOneOptions<Plant> => {
      return {
        where: {
          orisCode: args.value,
        },
      };
    },
  )
  orisCode: number;

  @ApiProperty()
  unitStack?: string;
}
