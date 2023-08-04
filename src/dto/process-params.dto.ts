import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ProcessParamsDTO {
  @ApiProperty()
  @IsString()
  submissionSetId: string;
}
