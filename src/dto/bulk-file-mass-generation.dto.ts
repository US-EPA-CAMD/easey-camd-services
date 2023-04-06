import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber } from 'class-validator';

export class TimePeriodDTO {
  @ApiProperty()
  @IsNumber()
  from: number;

  @ApiProperty()
  @IsNumber()
  to: number;
}

export class ProgramCodeDTO {
  @ApiProperty()
  @IsArray()
  programCodes: string[];
}

export class ApportionedEmissionsStateDTO extends TimePeriodDTO {
  @ApiProperty()
  @IsArray()
  stateCodes: string[];

  @ApiProperty({
    enum: ['Daily', 'Hourly'],
    isArray: true,
    example: ['Daily', 'Hourly'],
  })
  @IsArray()
  subTypes: string[];

  @ApiProperty()
  @IsBoolean()
  generateStateMATS: boolean;
}

export class ApportionedEmissionsQuarterlyDTO extends TimePeriodDTO {
  @ApiProperty({
    enum: [1, 2, 3, 4],
    isArray: true,
    example: [1, 2, 3, 4],
  })
  @IsArray()
  quarters: number[];

  @ApiProperty({
    enum: ['Daily', 'Hourly'],
    isArray: true,
    example: ['Daily', 'Hourly'],
  })
  @IsArray()
  subTypes: string[];

  @ApiProperty()
  @IsBoolean()
  generateQuarterMATS: boolean;
}
