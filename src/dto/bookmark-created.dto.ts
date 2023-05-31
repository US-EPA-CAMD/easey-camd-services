import { ApiProperty } from '@nestjs/swagger';
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys,
} from '@us-epa-camd/easey-common/data-dictionary';
import { IsDate, IsNumber } from 'class-validator';

export class BookmarkCreatedDTO {
  @ApiProperty(
    DataDictionary.getMetadata(PropertyKeys.ID, OverrideKeys.BOOKMARK),
  )
  @IsNumber()
  bookmarkId: number;

  @ApiProperty(
    DataDictionary.getMetadata(PropertyKeys.ADD_DATE, OverrideKeys.BOOKMARK),
  )
  @IsDate()
  bookmarkAddDate: Date;
}
