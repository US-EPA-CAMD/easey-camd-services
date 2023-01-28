import { ApiProperty } from "@nestjs/swagger";
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys
} from '@us-epa-camd/easey-common/data-dictionary';

export class BoomarkPayloadDTO {
  @ApiProperty(
    DataDictionary.getMetadata(
      PropertyKeys.DATA_TYPE,
      OverrideKeys.BOOKMARK,
  ))
  dataType: string;

  @ApiProperty(
    DataDictionary.getMetadata(
      PropertyKeys.DATA_SUBTYPE,
      OverrideKeys.BOOKMARK,
  ))
  dataSubType: string;

  @ApiProperty()
  filters: any;

  @ApiProperty()
  dataPreview: {
    rendered: boolean;
    excludedColumns: string[];
  };
}
