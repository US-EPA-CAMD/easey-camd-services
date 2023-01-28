import { ApiProperty } from "@nestjs/swagger";
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys
} from '@us-epa-camd/easey-common/data-dictionary';

export class ReportDetailDTO {
  @ApiProperty(
    DataDictionary.getMetadata(
      PropertyKeys.DISPLAY_NAME,
      OverrideKeys.REPORT_DETAIL,
  ))
  displayName: string;

  @ApiProperty()
  templateCode: string;

  @ApiProperty()
  templateType: string;

  @ApiProperty()
  results: any[];
}