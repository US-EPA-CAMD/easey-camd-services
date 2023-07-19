import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RecipientPayloadDTO {
  @ApiProperty()
  @IsOptional()
  userId: string;
  @ApiProperty()
  @IsString()
  emailType: string;
  @ApiProperty()
  @IsOptional()
  plantId: number;
  @ApiProperty()
  @IsOptional()
  submissionType: string;
  @ApiProperty()
  @IsOptional()
  isMats: boolean;
  @ApiProperty()
  @IsOptional()
  plantIdList: number[];
}
