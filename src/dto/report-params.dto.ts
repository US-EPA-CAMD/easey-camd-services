import { Transform } from 'class-transformer';
import { ApiProperty } from "@nestjs/swagger";
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys
} from '@us-epa-camd/easey-common/data-dictionary';

export class ReportParamsDTO {
  @ApiProperty(
    DataDictionary.getMetadata(
      PropertyKeys.CODE,
      OverrideKeys.REPORT,
      true,
  ))
  reportCode: string;

  @ApiProperty()
  facilityId?: number;

  @ApiProperty()
  monitorPlanId?: string;

  @ApiProperty({ isArray: true })
  @Transform(({ value }) => value.split('|').map((item: string) => item.trim()))
  testId?: string[];

  @ApiProperty()
  //@Transform(({ value }) => value.split('|').map((item: string) => item.trim()))
  qceId?: string;

  @ApiProperty()
  //@Transform(({ value }) => value.split('|').map((item: string) => item.trim()))
  teeId?: string;
}
