import { ApiProperty } from '@nestjs/swagger';
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys,
} from '@us-epa-camd/easey-common/data-dictionary';
import { IsDate, IsNumber, IsString } from 'class-validator';

export class BookmarkDTO {
  @ApiProperty(
    DataDictionary.getMetadata(PropertyKeys.ID, OverrideKeys.BOOKMARK),
  )
  @IsNumber()
  bookmarkId: number;

  @ApiProperty()
  @IsString()
  bookmarkData: string;

  @ApiProperty(
    DataDictionary.getMetadata(PropertyKeys.ADD_DATE, OverrideKeys.BOOKMARK),
  )
  @IsDate()
  bookmarkAddDate: Date;

  @ApiProperty()
  @IsDate()
  bookmarkLastAccessedDate: Date;

  @ApiProperty()
  @IsNumber()
  bookmarkHitCount: number;
}
