import { ApiProperty } from '@nestjs/swagger';

import { ReportColumnDTO } from './report-column.dto';
import { ReportParameterDTO } from './report-parameter.dto';

export class ReportDetailDTO {
  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  position: number;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  title: string;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  sqlStatement: string;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  noResultsMessage: string;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  columns: ReportColumnDTO[];

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  parameters: ReportParameterDTO[];

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  results: any[];
}