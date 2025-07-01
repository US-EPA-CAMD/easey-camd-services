import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsOptional, IsString } from "class-validator";

export class EvalSubmissionQueueOrderParamsDTO {
  @ApiProperty({
    isArray: true,
    description: 'Array of oris codes',
  })
  @Transform(({ value }) =>
    value.split('|').map((item: string) => parseInt(item.trim())),
  )
  @IsArray()
  orisCodes: number[];
}

export class EvaluationSubmissionQueueDTO {
  @IsString()
  monPlanIdentifier: string;

  @IsOptional()
  @IsString()
  testSumIdentifier?: string;

  @IsOptional()
  @IsString()
  qaCertEventIdentifier?: string;

  @IsOptional()
  @IsString()
  testExtensionExemptionIdentifier?: string;

  @IsOptional()
  @IsString()
  periodAbbreviation?: string;

  @IsOptional()
  @IsString()
  evalStatusCode?: string;

  @IsString()
  processCode: string;

}

export class EvaluationQueuePlaceDTO extends EvaluationSubmissionQueueDTO {
  @IsString()
  evaluationSetIdentifier: string;

  @IsString()
  evaluationIdentifier: string;
}

export class SubmissionQueuePlaceDTO extends EvaluationSubmissionQueueDTO {
  @IsString()
  submissionSetIdentifier: string;

  @IsString()
  submissionIdentifier: string;
}