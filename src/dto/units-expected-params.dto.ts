import { IsOptional, IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsInRange } from '@us-epa-camd/easey-common/pipes';
import { propertyMetadata } from '@us-epa-camd/easey-common';

export class UnitsExpectedParamsDTO {
  @ApiProperty({
    description: propertyMetadata.facilityId.description,
    example: propertyMetadata.facilityId.example,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  facilityId?: number;

  @ApiProperty({
    description: propertyMetadata.facilityName.description,
    example: propertyMetadata.facilityName.example,
  })
  @IsOptional()
  @IsString()
  facilityName?: string;

  @ApiProperty({
    description: propertyMetadata.stateCode.description,
    example: propertyMetadata.stateCode.example,
  })
  @IsOptional()
  @IsString()
  stateCode?: string;

  @ApiProperty({
    description: propertyMetadata.programCode.description,
    example: propertyMetadata.programCode.example,
    required: true,
  })
  @IsString({ message: "Program Code is required" })
  programCode: string;

  @ApiProperty({
    description: propertyMetadata.year.description,
    example: propertyMetadata.year.example,
    required: true,
  })
  @IsNotEmpty({ message: 'year is required' })
  @IsNumber({}, { message: 'year must be a number' })
  @Transform(({ value }) => Number(value))
  year: number;

  @ApiProperty({
    description: propertyMetadata.quarter.description,
    example: propertyMetadata.quarter.example,
    required: true,
  })
  @IsNotEmpty({ message: 'quarter is required' })
  @IsNumber({}, { message: 'quarter must be a number' })
  @IsInRange(1, 4, {
    message: () => {
      return `Ensure that the Quarter value is a number from 1 to 4.`;
    },
  })
  @Transform(({ value }) => Number(value))
  quarter: number;

  @ApiProperty({
    description: 'Window Status',
    example: 'Open',
    required: false,
  })
  @IsOptional()
  @IsString()
  windowStatus?: string;
}