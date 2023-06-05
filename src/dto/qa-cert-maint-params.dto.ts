import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class QaCertMaintParamsDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'orisCode is required' })
  orisCode: number;

  @ApiProperty()
  unitStack?: string;
}
