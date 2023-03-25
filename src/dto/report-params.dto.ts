import { IsNotEmpty } from 'class-validator';
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
  @IsNotEmpty({ message: 'Report Code is required' })
  reportCode: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Facility Id is required' })
  facilityId: number;

  @ApiProperty()
  monitorPlanId?: string;

  @ApiProperty({ isArray: true })
  @Transform(({ value }) => value.split('|').map((item: string) => item.trim()))
  testId?: string[];

  @ApiProperty()
  qceId?: string;

  @ApiProperty()
  teeId?: string;

  @ApiProperty()
  year?: number;

  @ApiProperty()
  quarter?: number;  
}
