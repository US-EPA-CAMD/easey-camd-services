import { ApiProperty } from '@nestjs/swagger';

export class ReportColumnDTO {
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
  displayName: string;
}