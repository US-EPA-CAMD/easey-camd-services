import { ApiProperty } from '@nestjs/swagger';

export class ServerErrorDto {
  @ApiProperty({
    description: 'Error message to log',
  })
  errorMessage: string;

  @ApiProperty({
    description: 'Metadata, key value pair of additional information to log',
  })
  metadata: object;
}
