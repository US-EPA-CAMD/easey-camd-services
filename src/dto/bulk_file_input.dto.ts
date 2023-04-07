import { ApiProperty } from '@nestjs/swagger';
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys,
} from '@us-epa-camd/easey-common/data-dictionary';
import { IsNumber, IsObject, IsString } from 'class-validator';

export class BulkFileInputDTO {
  @ApiProperty(
    DataDictionary.getMetadata(PropertyKeys.NAME, OverrideKeys.BULK_FILE),
  )
  @IsString()
  filename: string;

  @ApiProperty()
  @IsString()
  s3Path: string;

  @ApiProperty()
  @IsNumber()
  bytes: number;

  @ApiProperty()
  @IsObject()
  metadata: object;
}
