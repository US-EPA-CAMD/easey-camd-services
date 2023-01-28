import { ApiProperty } from "@nestjs/swagger";
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys
} from '@us-epa-camd/easey-common/data-dictionary';

export class BulkFileInputDTO {
  @ApiProperty(
    DataDictionary.getMetadata(
      PropertyKeys.NAME,
      OverrideKeys.BULK_FILE,
  ))
  filename: string;

  @ApiProperty()
  s3Path: string;

  @ApiProperty()
  bytes: number;

  @ApiProperty()
  metadata: object;
}
