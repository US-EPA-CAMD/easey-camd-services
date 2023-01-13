import { ApiProperty } from '@nestjs/swagger';

export class ReportDetailDTO {
  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  displayName: string;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  templateCode: string;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  templateType: string;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  sqlStatement: string;

  // @ApiProperty({
  //   description: 'NEED TO UPDATE DESCRIPTION',
  // })
  // noResultsMessage: string;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  results: any[];
}