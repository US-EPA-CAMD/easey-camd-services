import { ApiProperty } from "@nestjs/swagger";
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys
} from '@us-epa-camd/easey-common/data-dictionary';

export class CreateMailDto {
  @ApiProperty()
  fromEmail: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  message: string;
}
