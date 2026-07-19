import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { ImportFileType } from '../enums/import-file-type.enum';

// Returned when a new import set is created.
export class CreateImportSetResponseDTO {
  importSetId: string;
}

// Metadata returned for a file after it has been staged (parsed + uploaded to the staging bucket).
export class StagedFileDTO {
  fileName: string;
  s3Path: string;
  fileType: ImportFileType;
  orisCode: number;
  monPlanId: string;
  unitStackPipe: string;
  rptPeriodId?: number;
  reportingPeriod?: string; // e.g. "2024 Q1" (EM only)
  fileSize: number;
}

// A single staged file being finalized into an import_queue row.
export class SubmitImportItemDTO {
  @IsString()
  monPlanId: string;

  @IsString()
  s3Path: string;

  @IsString()
  fileName: string;

  @IsEnum(ImportFileType)
  fileType: ImportFileType;

  @IsInt()
  orisCode: number;

  @IsOptional()
  @IsInt()
  rptPeriodId?: number;
}

export class SubmitImportDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitImportItemDTO)
  items: SubmitImportItemDTO[];
}

// Removes staged files from an in-progress (NEW) import by their S3 paths.
// Used both for user-initiated removal from the table and for dropping a file
// whose plan failed checkout during add.
export class DeleteImportFilesDTO {
  // Specific staged objects to remove. Omit to clear all staged files for the set.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  s3Paths?: string[];
}

// One import_queue row as returned for polling (Unit/Stack/Pipe + period derived).
export class ImportQueueItemDTO {
  importId: number;
  fileName: string;
  fileType: ImportFileType;
  orisCode: number;
  monPlanId: string;
  statusCode: string;
  note: string;
  year: number;
  quarter: number;
  unitStackPipe: string;
}

// An import set with its queue rows, returned by GET latest / GET set/:id.
export class ImportSetDTO {
  importSetId: string;
  userId: string;
  userEmail: string;
  addTime: Date;
  queuedTime: Date;
  startedTime: Date;
  completedTime: Date;
  note: string;
  noteTime: Date;
  statusCode: string;
  files: ImportQueueItemDTO[];
}
