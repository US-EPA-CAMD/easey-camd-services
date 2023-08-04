import { ApiProperty } from '@nestjs/swagger';

export class SuccessMessageDTO {
  @ApiProperty({
    example: 'Record with id [abc123def456] has been successfully deleted.',
  })
  message: string;
}
