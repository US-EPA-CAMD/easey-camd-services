import { ApiProperty } from "@nestjs/swagger";
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys
} from '@us-epa-camd/easey-common/data-dictionary';

export class BookmarkCreatedDTO {
  @ApiProperty(
    DataDictionary.getMetadata(
      PropertyKeys.ID,
      OverrideKeys.BOOKMARK,
  ))
  bookmarkId: number;

  @ApiProperty(
    DataDictionary.getMetadata(
      PropertyKeys.ADD_DATE,
      OverrideKeys.BOOKMARK,
  ))
  bookmarkAddDate: Date;
}
