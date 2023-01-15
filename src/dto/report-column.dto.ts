import { ApiProperty } from '@nestjs/swagger';

export class ReportColumnDTO {
  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  code: string;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  values: any[];
}