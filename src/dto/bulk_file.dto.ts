import { ApiProperty } from "@nestjs/swagger";
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys
} from '@us-epa-camd/easey-common/data-dictionary';

export class BulkFileDTO {
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
  kiloBytes: number;

  @ApiProperty()
  megaBytes: number;

  @ApiProperty()
  gigaBytes: number;

  @ApiProperty()
  lastUpdated: Date;

  @ApiProperty()
  metadata: object;
}
