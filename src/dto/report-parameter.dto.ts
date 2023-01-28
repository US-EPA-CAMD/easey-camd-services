import { ApiProperty } from "@nestjs/swagger";
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys
} from '@us-epa-camd/easey-common/data-dictionary';

export class ReportParameterDTO {
  @ApiProperty(
    DataDictionary.getMetadata(
      PropertyKeys.ORDER,
      OverrideKeys.REPORT_PARAM,
  ))
  position: number;

  @ApiProperty(
    DataDictionary.getMetadata(
      PropertyKeys.NAME,
      OverrideKeys.REPORT_PARAM,
  ))
  name: string;

  @ApiProperty()
  defaultValue: any;
}