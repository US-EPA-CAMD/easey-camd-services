import { ApiProperty } from "@nestjs/swagger";
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys
} from '@us-epa-camd/easey-common/data-dictionary';

export class ServerErrorDto {
  @ApiProperty()
  errorMessage: string;

  @ApiProperty()
  metadata: object;
}
