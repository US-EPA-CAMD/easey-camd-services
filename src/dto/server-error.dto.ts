import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ServerErrorDto {
  @ApiProperty()
  @IsString()
  errorId: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  stackTrace: string;
}
