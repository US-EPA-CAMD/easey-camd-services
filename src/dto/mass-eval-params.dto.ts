import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MassEvalParamsDTO {
  @ApiProperty()
  @IsString()
  fromEmail: string;

  @ApiProperty()
  @IsString()
  toEmail: string;

  @ApiProperty()
  @IsString()
  evaluationSetId: string;
}
