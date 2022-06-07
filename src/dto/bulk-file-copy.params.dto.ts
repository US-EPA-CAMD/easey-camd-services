import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

enum CopyTypes {
  EDR = 'EDR',
  MP = 'MP',
  EM = 'EM',
  QA = 'QA',
}

export class BulkFileCopyParamsDTO {
  @ApiProperty({
    enum: CopyTypes,
    description: 'Type of data to load',
  })
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    minimum: 1980,
    maximum: 2022,
    description: 'The year from which you wish to start generating data',
  })
  @IsOptional()
  from?: number;

  @ApiProperty({
    minimum: 1980,
    maximum: 2022,
    description: 'The year in which you wish to query through',
  })
  @IsOptional()
  to?: number;
}
