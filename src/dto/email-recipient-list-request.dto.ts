import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber, IsNotEmpty } from 'class-validator';

export class EmailRecipientListRequestDto {
  @ApiProperty({
    description: 'The type of email',
    example: 'SUBMISSIONREMINDER',
  })
  @IsString()
  @IsNotEmpty()
  emailType: string;

  @ApiProperty({
    description: 'List of plant IDs',
    example: [1, 3, 5],
    isArray: true,
    type: Number,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  plantIdList: number[];
}