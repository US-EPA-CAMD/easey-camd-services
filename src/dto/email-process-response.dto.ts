import { ApiProperty } from '@nestjs/swagger';

export class EmailProcessResponseDto {
  @ApiProperty({
    description: 'Indicates if the email was successfully processed',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Error message if processing failed',
    example: 'Email record not found',
    required: false,
  })
  message?: string;
}