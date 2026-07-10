import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Brackets, EntityManager, Not } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';
import { Logger } from '@us-epa-camd/easey-common/logger';

import { StagedFileDTO, SubmitImportItemDTO } from '../dto/bulk-import.dto';
import { ImportQueue } from '../entities/import-queue.entity';
import { ImportSet } from '../entities/import-set.entity';
import { ReportingPeriod } from '../entities/reporting-period.entity';
import { ImportFileType } from '../enums/import-file-type.enum';

const BULK_IMPORT_PREFIX = 'bulk-import';

// Expression that aggregates a plan's unit ids / stack names for display.
const UNIT_STACK_PIPE_AGG = "string_agg(COALESCE(u.unitid, sp.stack_name), ', ')";

// Parsed identity of a staged file, before it is uploaded / turned into a row.
interface ParsedFile {
  fileType: ImportFileType;
  orisCode: number;
  monPlanId: string;
  unitStackPipe: string;
  rptPeriodId?: number;
  reportingPeriod?: string;
}

@Injectable()
export class BulkImportService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly entityManager: EntityManager,
    private readonly logger: Logger,
  ) {
    this.s3Client = new S3Client({
      credentials: this.configService.get('fileStagingConfig.credentials'),
      region: this.configService.get('fileStagingConfig.region'),
    });
    this.bucket = this.configService.get('fileStagingConfig.bucket');
  }

  // Creates a new, empty import set in the NEW state.
  async createSet(
    userId: string,
    userEmail: string,
  ): Promise<{ importSetId: string }> {
    const record = this.entityManager.create(ImportSet, {
      importSetId: uuidv4(),
      userId,
      userEmail,
      addTime: new Date(),
    });
    await this.entityManager.save(record);
    return { importSetId: record.importSetId };
  }

  // Parses + validates each file, uploads it to the set's staging folder, and returns its metadata.
  async stageFiles(
    importSetId: string,
    files: Express.Multer.File[],
    user: CurrentUser,
  ): Promise<StagedFileDTO[]> {
    await this.getEditableSet(importSetId, user);

    const staged: StagedFileDTO[] = [];
    for (const file of files) {
      const parsed = await this.parseAndResolve(file);
      const s3Path = this.stagePath(importSetId, file.originalname);

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: s3Path,
          Body: file.buffer,
        }),
      );

      staged.push({
        fileName: file.originalname,
        s3Path,
        fileType: parsed.fileType,
        orisCode: parsed.orisCode,
        monPlanId: parsed.monPlanId,
        unitStackPipe: parsed.unitStackPipe,
        rptPeriodId: parsed.rptPeriodId,
        reportingPeriod: parsed.reportingPeriod,
        fileSize: file.size,
      });
    }
    return staged;
  }

  // Removes staged objects for the set. With s3Paths, deletes those specific
  // objects (user removed a file, or its plan failed checkout during add).
  // Without, clears every staged object under the set's folder (cancel / submit
  // failure). The NEW import_set row is always left in place as a record.
  async deleteFiles(
    importSetId: string,
    s3Paths: string[] | undefined,
    user: CurrentUser,
  ): Promise<void> {
    await this.getEditableSet(importSetId, user);

    const prefix = `${BULK_IMPORT_PREFIX}/${importSetId}/`;

    // Delete a specific set of objects (scoped to this set's folder).
    if (s3Paths && s3Paths.length > 0) {
      const keys = s3Paths.filter((p) => p.startsWith(prefix));
      if (keys.length === 0) return;
      await this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })) },
        }),
      );
      return;
    }

    // Otherwise clear every staged object under the set's folder.
    let continuationToken: string | undefined;
    do {
      const listed = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      const objects = listed.Contents ?? [];
      if (objects.length > 0) {
        await this.s3Client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: objects.map((o) => ({ Key: o.Key })) },
          }),
        );
      }
      continuationToken = listed.IsTruncated
        ? listed.NextContinuationToken
        : undefined;
    } while (continuationToken);
  }

  // Finalizes the set: creates one import_queue row per staged file and moves
  // the set + rows to QUEUED. Roles + checkout were enforced by the RoleGuard.
  async submit(
    importSetId: string,
    items: SubmitImportItemDTO[],
    user: CurrentUser,
  ): Promise<void> {
    const set = await this.getEditableSet(importSetId, user);

    if (!items || items.length === 0) {
      throw new EaseyException(
        new Error('Cannot submit an import with no files.'),
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.entityManager.transaction(async (trx) => {
      const now = new Date();
      for (const item of items) {
        const row = trx.create(ImportQueue, {
          importSetId,
          monPlanId: item.monPlanId,
          fileName: item.fileName,
          tempS3BucketFilePath: item.s3Path,
          fileTypeCode: item.fileType,
          orisCode: item.orisCode,
          rptPeriodId: item.rptPeriodId ?? null,
          addTime: now,
          queuedTime: now,
        });
        await trx.save(row);
      }
      set.queuedTime = now;
      await trx.save(set);
    });
  }

  // Latest submitted set for the user.
  async getLatest(userId: string) {
    const set = await this.entityManager.findOne(ImportSet, {
      where: { userId, statusCode: Not('NEW') },
      order: { addTime: 'DESC' },
    });
    if (!set) return null;
    return this.getSet(set.importSetId);
  }

  async getSet(importSetId: string) {
    const set = await this.entityManager.findOneBy(ImportSet, { importSetId });
    if (!set) {
      throw new EaseyException(
        new Error('Import set not found.'),
        HttpStatus.NOT_FOUND,
      );
    }

    const files = await this.entityManager
      .createQueryBuilder(ImportQueue, 'iq')
      .select('iq.import_id', 'importId')
      .addSelect('iq.file_name', 'fileName')
      .addSelect('iq.file_type_cd', 'fileType')
      .addSelect('iq.oris_code', 'orisCode')
      .addSelect('iq.mon_plan_id', 'monPlanId')
      .addSelect('iq.status_cd', 'statusCode')
      .addSelect('iq.note', 'note')
      .addSelect('rp.calendar_year', 'year')
      .addSelect('rp.quarter', 'quarter')
      .addSelect(
        (sub) =>
          sub
            .select(UNIT_STACK_PIPE_AGG)
            .from('camdecmpswks.monitor_plan_location', 'mpl')
            .innerJoin(
              'camdecmpswks.monitor_location',
              'ml',
              'ml.mon_loc_id = mpl.mon_loc_id',
            )
            .leftJoin('camd.unit', 'u', 'u.unit_id = ml.unit_id')
            .leftJoin(
              'camdecmpswks.stack_pipe',
              'sp',
              'sp.stack_pipe_id = ml.stack_pipe_id',
            )
            .where('mpl.mon_plan_id = iq.mon_plan_id'),
        'unitStackPipe',
      )
      .leftJoin(
        'camdecmpsmd.reporting_period',
        'rp',
        'rp.rpt_period_id = iq.rpt_period_id',
      )
      .where('iq.import_set_id = :importSetId', { importSetId })
      .orderBy('iq.oris_code')
      .addOrderBy(
        "CASE iq.file_type_cd WHEN 'MP' THEN 1 WHEN 'QA' THEN 2 WHEN 'EM' THEN 3 ELSE 4 END",
      )
      .addOrderBy('rp.quarter', 'ASC', 'NULLS FIRST')
      .getRawMany();

    return { ...set, files };
  }

  /* ---------- helpers ---------- */

  private stagePath(importSetId: string, fileName: string): string {
    return `${BULK_IMPORT_PREFIX}/${importSetId}/${fileName}`;
  }

  // Loads the set, ensuring it exists, belongs to the caller, and is still NEW.
  private async getEditableSet(
    importSetId: string,
    user: CurrentUser,
  ): Promise<ImportSet> {
    const set = await this.entityManager.findOneBy(ImportSet, { importSetId });
    if (!set) {
      throw new EaseyException(
        new Error('Import set not found.'),
        HttpStatus.NOT_FOUND,
      );
    }
    if (set.userId !== user.userId) {
      throw new EaseyException(
        new Error('Import set does not belong to the current user.'),
        HttpStatus.FORBIDDEN,
      );
    }
    if (set.statusCode !== 'NEW') {
      throw new EaseyException(
        new Error('Import set is no longer editable.'),
        HttpStatus.BAD_REQUEST,
      );
    }
    return set;
  }

  // Parses a file's JSON, determines its type, and resolves its active plan.
  private async parseAndResolve(
    file: Express.Multer.File,
  ): Promise<ParsedFile> {
    let json: any;
    try {
      json = JSON.parse(file.buffer.toString('utf8'));
    } catch {
      throw new EaseyException(
        new Error(`${file.originalname} is not a valid JSON file.`),
        HttpStatus.BAD_REQUEST,
      );
    }

    const orisCode = json?.orisCode;
    if (orisCode == null) {
      throw new EaseyException(
        new Error(`${file.originalname} is missing an ORIS code.`),
        HttpStatus.BAD_REQUEST,
      );
    }

    const fileType = this.determineFileType(json, file.originalname);
    const { unitIds, stackNames } = this.collectLocations(json);
    const monPlanId = await this.resolveActiveMonPlanId(
      orisCode,
      unitIds,
      stackNames,
      file.originalname,
    );
    const unitStackPipe = await this.deriveUnitStackPipe(monPlanId);

    let rptPeriodId: number | undefined;
    let reportingPeriod: string | undefined;
    if (fileType === ImportFileType.EM) {
      rptPeriodId = await this.resolveReportingPeriodId(
        json.year,
        json.quarter,
        file.originalname,
      );
      reportingPeriod = `${json.year} Q${json.quarter}`;
    }

    return {
      fileType,
      orisCode,
      monPlanId,
      unitStackPipe,
      rptPeriodId,
      reportingPeriod,
    };
  }

  private determineFileType(json: any, fileName: string): ImportFileType {
    if (json.year != null && json.quarter != null) {
      return ImportFileType.EM;
    }
    if (
      json.testSummaryData ||
      json.certificationEventData ||
      json.testExtensionExemptionData
    ) {
      return ImportFileType.QA;
    }
    if (json.monitoringLocationData || json.unitStackConfigurationData) {
      return ImportFileType.MP;
    }
    throw new EaseyException(
      new Error(`${fileName} is not a recognized MP, QA, or EM file.`),
      HttpStatus.BAD_REQUEST,
    );
  }

  // Collects distinct unit ids / stack names referenced anywhere in the file's
  // top-level data arrays. unitId -> unit.unitid, stackPipeId -> stack_pipe.stack_name.
  private collectLocations(json: any): {
    unitIds: string[];
    stackNames: string[];
  } {
    const unitIds = new Set<string>();
    const stackNames = new Set<string>();
    for (const value of Object.values(json)) {
      if (!Array.isArray(value)) continue;
      for (const item of value) {
        if (item && typeof item === 'object') {
          if (item.unitId != null) unitIds.add(String(item.unitId));
          if (item.stackPipeId != null) stackNames.add(String(item.stackPipeId));
        }
      }
    }
    return { unitIds: [...unitIds], stackNames: [...stackNames] };
  }

  // Resolves the single active (end_rpt_period_id IS NULL) monitor plan for the
  // facility that contains the file's locations.
  private async resolveActiveMonPlanId(
    orisCode: number,
    unitIds: string[],
    stackNames: string[],
    fileName: string,
  ): Promise<string> {
    if (unitIds.length === 0 && stackNames.length === 0) {
      throw new EaseyException(
        new Error(`${fileName} does not reference any unit, stack, or pipe.`),
        HttpStatus.BAD_REQUEST,
      );
    }

    const rows = await this.entityManager
      .createQueryBuilder()
      .select('DISTINCT mp.mon_plan_id', 'monPlanId')
      .from('camdecmpswks.monitor_plan', 'mp')
      .innerJoin('camd.plant', 'p', 'p.fac_id = mp.fac_id')
      .innerJoin(
        'camdecmpswks.monitor_plan_location',
        'mpl',
        'mpl.mon_plan_id = mp.mon_plan_id',
      )
      .innerJoin(
        'camdecmpswks.monitor_location',
        'ml',
        'ml.mon_loc_id = mpl.mon_loc_id',
      )
      .leftJoin('camd.unit', 'u', 'u.unit_id = ml.unit_id')
      .leftJoin(
        'camdecmpswks.stack_pipe',
        'sp',
        'sp.stack_pipe_id = ml.stack_pipe_id',
      )
      .where('p.oris_code = :orisCode', { orisCode })
      .andWhere('mp.end_rpt_period_id IS NULL')
      .andWhere(
        new Brackets((w) => {
          if (unitIds.length) {
            w.orWhere('u.unitid IN (:...unitIds)', { unitIds });
          }
          if (stackNames.length) {
            w.orWhere('sp.stack_name IN (:...stackNames)', { stackNames });
          }
        }),
      )
      .getRawMany();

    if (rows.length === 0) {
      throw new EaseyException(
        new Error(
          `No active monitoring plan found for ${fileName} (ORIS ${orisCode}).`,
        ),
        HttpStatus.BAD_REQUEST,
      );
    }
    if (rows.length > 1) {
      throw new EaseyException(
        new Error(
          `${fileName} matches multiple monitoring plans for ORIS ${orisCode}.`,
        ),
        HttpStatus.BAD_REQUEST,
      );
    }
    return rows[0].monPlanId;
  }

  private async resolveReportingPeriodId(
    year: number,
    quarter: number,
    fileName: string,
  ): Promise<number> {
    const period = await this.entityManager.findOneBy(ReportingPeriod, {
      calendarYear: year,
      quarter,
    });
    if (!period) {
      throw new EaseyException(
        new Error(
          `${fileName} has an invalid reporting period ${year} Q${quarter}.`,
        ),
        HttpStatus.BAD_REQUEST,
      );
    }
    return period.rptPeriodIdentifier;
  }

  private async deriveUnitStackPipe(monPlanId: string): Promise<string> {
    const row = await this.entityManager
      .createQueryBuilder()
      .select(UNIT_STACK_PIPE_AGG, 'unitStackPipe')
      .from('camdecmpswks.monitor_plan_location', 'mpl')
      .innerJoin(
        'camdecmpswks.monitor_location',
        'ml',
        'ml.mon_loc_id = mpl.mon_loc_id',
      )
      .leftJoin('camd.unit', 'u', 'u.unit_id = ml.unit_id')
      .leftJoin(
        'camdecmpswks.stack_pipe',
        'sp',
        'sp.stack_pipe_id = ml.stack_pipe_id',
      )
      .where('mpl.mon_plan_id = :monPlanId', { monPlanId })
      .getRawOne();
    return row?.unitStackPipe ?? '';
  }
}
