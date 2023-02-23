import { ApiProperty } from '@nestjs/swagger';

export class TimePeriodDTO {
  @ApiProperty()
  from: number;

  @ApiProperty()
  to: number;
}

export class ProgramCodeDTO {
  @ApiProperty()
  programCodes: string[];
}

export class ApportionedEmissionsStateDTO extends TimePeriodDTO {
  @ApiProperty()
  stateCodes: string[];

  @ApiProperty({
    enum: ['Daily', 'Hourly'],
    isArray: true,
    example: ['Daily', 'Hourly'],
  })
  subTypes: string[];

  @ApiProperty()
  generateStateMATS: boolean;
}

export class ApportionedEmissionsQuarterlyDTO extends TimePeriodDTO {
  @ApiProperty({
    enum: [1, 2, 3, 4],
    isArray: true,
    example: [1, 2, 3, 4],
  })
  quarters: number[];

  @ApiProperty({
    enum: ['Daily', 'Hourly'],
    isArray: true,
    example: ['Daily', 'Hourly'],
  })
  subTypes: string[];

  @ApiProperty()
  generateQuarterMATS: boolean;
}
