import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class QaUpdateDto {
  @ApiProperty()
  @IsString()
  resubExplanation: string;
}
