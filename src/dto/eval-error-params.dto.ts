import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class EvaluationStageDTO {
  @ApiProperty()
  @IsString()
  action: string;

  @ApiProperty()
  @IsString()
  dateTime: string;
}

export class EvalErrorParamsDTO {
  @ApiProperty()
  @IsString()
  evaluationSetId: string;

  @ApiProperty()
  @IsNumber()
  evaluationId: number;

  @ApiProperty()
  @IsString()
  rootError: string;

  @ApiProperty({ required: false, description: 'Stack trace from the original exception' })
  @IsOptional()
  @IsString()
  errorStack?: string;

  @ApiProperty({ type: [EvaluationStageDTO] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationStageDTO)
  evaluationStages: EvaluationStageDTO[];
}
