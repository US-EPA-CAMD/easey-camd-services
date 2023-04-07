import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateMailDto {
  @ApiProperty()
  @IsString()
  fromEmail: string;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  message: string;
}
