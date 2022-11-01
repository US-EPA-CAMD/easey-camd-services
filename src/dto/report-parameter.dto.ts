import { ApiProperty } from '@nestjs/swagger';

export class ReportParameterDTO {
  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  position: number;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  name: string;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  defaultValue: any;
}