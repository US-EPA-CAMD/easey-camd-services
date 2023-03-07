import { ApiProperty } from '@nestjs/swagger';

export class MassEvalParamsDTO {
  @ApiProperty()
  fromEmail: string;

  @ApiProperty()
  toEmail: string;

  @ApiProperty()
  evaluationSetId: string;
}
