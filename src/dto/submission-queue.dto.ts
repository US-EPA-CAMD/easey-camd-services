import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { EvaluationDTO } from './evaluation.dto';

export class SubmissionQueueDTO extends EvaluationDTO {
  @ApiProperty()
  @IsString()
  activityId: string;
}
