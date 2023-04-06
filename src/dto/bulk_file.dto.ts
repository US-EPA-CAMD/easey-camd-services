import { ApiProperty } from '@nestjs/swagger';
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys,
} from '@us-epa-camd/easey-common/data-dictionary';
import { IsDate, IsNumber, IsObject, IsString } from 'class-validator';

export class BulkFileDTO {
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
  @IsNumber()
  kiloBytes: number;

  @ApiProperty()
  @IsNumber()
  megaBytes: number;

  @ApiProperty()
  @IsNumber()
  gigaBytes: number;

  @ApiProperty()
  @IsDate()
  lastUpdated: Date;

  @ApiProperty()
  @IsObject()
  metadata: object;
}
