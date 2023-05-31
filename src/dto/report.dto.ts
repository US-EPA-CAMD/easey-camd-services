import { ApiProperty } from '@nestjs/swagger';
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys,
} from '@us-epa-camd/easey-common/data-dictionary';

import { ReportColumnDTO } from './report-column.dto';
import { ReportDetailDTO } from './report-detail.dto';

export class ReportDTO {
  @ApiProperty(
    DataDictionary.getMetadata(PropertyKeys.DISPLAY_NAME, OverrideKeys.REPORT),
  )
  displayName: string;

  @ApiProperty()
  columns: ReportColumnDTO[];

  @ApiProperty()
  details: ReportDetailDTO[];
}
