import { ApiProperty } from '@nestjs/swagger';
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys,
} from '@us-epa-camd/easey-common/data-dictionary';
import { Allow, IsString } from 'class-validator';

export class BoomarkPayloadDTO {
  @ApiProperty(
    DataDictionary.getMetadata(PropertyKeys.DATA_TYPE, OverrideKeys.BOOKMARK),
  )
  @IsString()
  dataType: string;

  @ApiProperty(
    DataDictionary.getMetadata(
      PropertyKeys.DATA_SUBTYPE,
      OverrideKeys.BOOKMARK,
    ),
  )
  @IsString()
  dataSubType: string;

  @ApiProperty()
  @Allow()
  filters: any;

  @ApiProperty()
  @Allow()
  dataPreview: {
    rendered: boolean;
    excludedColumns: string[];
  };
}
