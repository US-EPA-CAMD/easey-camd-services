import { ApiProperty } from '@nestjs/swagger';
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys,
} from '@us-epa-camd/easey-common/data-dictionary';
import { Allow, IsNumber, IsString } from 'class-validator';

export class ReportParameterDTO {
  @ApiProperty(
    DataDictionary.getMetadata(PropertyKeys.ORDER, OverrideKeys.REPORT_PARAM),
  )
  @IsNumber()
  position: number;

  @ApiProperty(
    DataDictionary.getMetadata(PropertyKeys.NAME, OverrideKeys.REPORT_PARAM),
  )
  @IsString()
  name: string;

  @ApiProperty()
  @Allow()
  defaultValue: any;
}
