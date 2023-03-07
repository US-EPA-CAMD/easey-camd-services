import { ApiProperty } from '@nestjs/swagger';

export class CreateMailDto {
  @ApiProperty()
  fromEmail: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  message: string;
}
