import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ProcessMailDTO {
  @ApiProperty()
  @IsNumber()
  emailToProcessId: number;
}
