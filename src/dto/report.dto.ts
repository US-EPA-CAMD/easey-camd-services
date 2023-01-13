import { ApiProperty } from '@nestjs/swagger';

import { ReportColumnDTO } from './report-column.dto';
import { ReportDetailDTO } from './report-detail.dto';

export class ReportDTO {
  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  displayName: string;

  // @ApiProperty({
  //   description: 'NEED TO UPDATE DESCRIPTION',
  // })
  // facilityId: number;

  // @ApiProperty({
  //   description: 'NEED TO UPDATE DESCRIPTION',
  // })
  // orisCode: number;

  // @ApiProperty({
  //   description: 'NEED TO UPDATE DESCRIPTION',
  // })
  // facilityName: string;

  // @ApiProperty({
  //   description: 'NEED TO UPDATE DESCRIPTION',
  // })
  // stateCode: string;

  // @ApiProperty({
  //   description: 'NEED TO UPDATE DESCRIPTION',
  // })
  // countyName: string;

  // @ApiProperty({
  //   description: 'NEED TO UPDATE DESCRIPTION',
  // })
  // unitStackInfo: string;

  // @ApiProperty({
  //   description: 'NEED TO UPDATE DESCRIPTION',
  // })
  // noResultsMessage: string;

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  columns: ReportColumnDTO[];  

  @ApiProperty({
    description: 'NEED TO UPDATE DESCRIPTION',
  })
  details: ReportDetailDTO[];
}
