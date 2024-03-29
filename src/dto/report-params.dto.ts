import { IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  DataDictionary,
  OverrideKeys,
  PropertyKeys,
} from '@us-epa-camd/easey-common/data-dictionary';

export class ReportParamsDTO {
  @ApiProperty(
    DataDictionary.getMetadata(PropertyKeys.CODE, OverrideKeys.REPORT, true),
  )
  @IsNotEmpty({ message: 'Report Code is required' })
  reportCode: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Facility Id is required' })
  facilityId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  monitorPlanId?: string;

  @ApiProperty({ isArray: true, required: false })
  @IsOptional()
  @Transform(({ value }) => value.split('|').map((item: string) => item.trim()))
  testId?: string[];

  @ApiProperty({ isArray: true, required: false })
  @IsOptional()
  @Transform(({ value }) => value.split('|').map((item: string) => item.trim()))
  qceId?: string[];

  @ApiProperty({ isArray: true, required: false })
  @IsOptional()
  @Transform(({ value }) => value.split('|').map((item: string) => item.trim()))
  teeId?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  year?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  quarter?: number;
}
