import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';

import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';

import { ImportQueueRequestItemDTO, StagedFileDTO } from '../dto/bulk-import.dto';
import { ImportQueue } from '../entities/import-queue.entity';
import { ImportSet } from '../entities/import-set.entity';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { ReportingPeriod } from '../entities/reporting-period.entity';
import { ImportFileType } from '../enums/import-file-type.enum';

const BULK_IMPORT_PREFIX = 'bulk-import';

// Each file type requires the corresponding facility data-submission privilege.
const REQUIRED_PERMISSION: Record<ImportFileType, string> = {
  [ImportFileType.MP]: 'DSMP',
  [ImportFileType.QA]: 'DSQA',
  [ImportFileType.EM]: 'DSEM',
};

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

  // Uploads each file to the staging folder under a client-generated staging ID
  // and returns its metadata. No import_set row exists until submit.
  async stageFiles(
    importSetId: string,
    files: Express.Multer.File[],
  ): Promise<StagedFileDTO[]> {
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

  // Removes staged objects under the staging ID. With s3Paths, deletes those
  // specific objects (a removed file, or a plan that failed checkout); without,
  // clears every staged object (cancel / submit failure).
  async deleteFiles(
    importSetId: string,
    s3Paths: string[] | undefined,
  ): Promise<void> {
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

  // Creates the import_set and one import_queue row per staged file, all QUEUED.
  // Roles + checkout were enforced by the RoleGuard.
  async queue(
    importSetId: string,
    items: ImportQueueRequestItemDTO[],
    userEmail: string,
    user: CurrentUser,
  ): Promise<void> {
    if (!items || items.length === 0) {
      throw new EaseyException(
        new Error('Cannot submit an import with no files.'),
        HttpStatus.BAD_REQUEST,
      );
    }

    this.assertFacilityPermissions(items, user);

    await this.entityManager.transaction(async (trx) => {
      const now = currentDateTime();
      const set = trx.create(ImportSet, {
        importSetId,
        userId: user.userId,
        userEmail,
        queuedTime: now,
      });
      await trx.save(set);

      for (const item of items) {
        const row = trx.create(ImportQueue, {
          importSetId,
          monPlanId: item.monPlanId,
          fileName: item.fileName,
          tempS3BucketFilePath: item.s3Path,
          fileTypeCode: item.fileType,
          orisCode: item.orisCode,
          rptPeriodId: item.rptPeriodId ?? null,
          queuedTime: now,
        });
        await trx.save(row);
      }
    });
  }

  // The submit RoleGuard enforces role + checkout for the plans, but a set mixes
  // MP/QA/EM files that each need a distinct facility privilege (DSMP/DSQA/DSEM),
  // which a single RoleGuard can't express. Enforce those per file here.
  private assertFacilityPermissions(
    items: ImportQueueRequestItemDTO[],
    user: CurrentUser,
  ): void {
    // Non-prod / mock contexts have no facilities and bypass the RoleGuard; match that.
    if (!user?.facilities) return;

    for (const item of items) {
      const required = REQUIRED_PERMISSION[item.fileType];
      const facility = user.facilities.find(
        (f) => f.orisCode === item.orisCode,
      );
      if (!facility?.permissions?.includes(required)) {
        throw new EaseyException(
          new Error(
            `You do not have ${required} permission for ORIS code ${item.orisCode}, required to import ${item.fileName}.`,
          ),
          HttpStatus.FORBIDDEN,
        );
      }
    }
  }

  // Latest submitted set for the user.
  async getLatest(userId: string) {
    const set = await this.entityManager.findOne(ImportSet, {
      where: { userId },
      order: { queuedTime: 'DESC' },
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
            .from(MonitorPlan, 'mp')
            .innerJoin('mp.locations', 'ml')
            .leftJoin('ml.unit', 'u')
            .leftJoin('ml.stackPipe', 'sp')
            .where('mp.mon_plan_id = iq.mon_plan_id'),
        'unitStackPipe',
      )
      .leftJoin('iq.reportingPeriod', 'rp')
      .where('iq.import_set_id = :importSetId', { importSetId })
      .orderBy('iq.oris_code')
      .addOrderBy(
        "CASE iq.file_type_cd WHEN 'MP' THEN 1 WHEN 'QA' THEN 2 WHEN 'EM' THEN 3 ELSE 4 END",
      )
      .addOrderBy('rp.quarter', 'ASC', 'NULLS FIRST')
      .getRawMany();

    return { ...set, files };
  }

  // Fetches a staged file's JSON contents from the staging bucket.
  async getStagedObject(s3Path: string): Promise<any> {
    const object = await this.s3Client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: s3Path }),
    );
    const body = await object.Body.transformToString('utf8');
    return JSON.parse(body);
  }

  /* ---------- helpers ---------- */

  private stagePath(importSetId: string, fileName: string): string {
    return `${BULK_IMPORT_PREFIX}/${importSetId}/${fileName}`;
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
    const items = Object.values(json).filter(Array.isArray).flat();
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      if (item.unitId != null) unitIds.add(String(item.unitId));
      if (item.stackPipeId != null) stackNames.add(String(item.stackPipeId));
    }
    return { unitIds: [...unitIds], stackNames: [...stackNames] };
  }

  // Resolves the single active (end_rpt_period_id IS NULL) monitor plan for the
  // facility that contains all of the file's locations.
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

    // A location matches the file when its unit id or stack name is referenced.
    const matchConditions: string[] = [];
    const totalLocations = unitIds.length + stackNames.length;
    const params: Record<string, unknown> = { orisCode, totalLocations };
    if (unitIds.length) {
      matchConditions.push('u.unitid IN (:...unitIds)');
      params.unitIds = unitIds;
    }
    if (stackNames.length) {
      matchConditions.push('sp.stack_name IN (:...stackNames)');
      params.stackNames = stackNames;
    }
    const matchExpr = matchConditions.join(' OR ');

    // Require every file location to be in the plan. 
    // The plan is free to have additional locations beyond those in the file.
    const rows = await this.entityManager
      .createQueryBuilder(MonitorPlan, 'mp')
      .select('mp.mon_plan_id', 'monPlanId')
      .innerJoin('mp.plant', 'p')
      .innerJoin('mp.locations', 'ml')
      .leftJoin('ml.unit', 'u')
      .leftJoin('ml.stackPipe', 'sp')
      .where('p.oris_code = :orisCode')
      .andWhere('mp.end_rpt_period_id IS NULL')
      .groupBy('mp.mon_plan_id')
      .having(`COUNT(CASE WHEN ${matchExpr} THEN 1 END) = :totalLocations`)
      .setParameters(params)
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
      .createQueryBuilder(MonitorPlan, 'mp')
      .select(UNIT_STACK_PIPE_AGG, 'unitStackPipe')
      .innerJoin('mp.locations', 'ml')
      .leftJoin('ml.unit', 'u')
      .leftJoin('ml.stackPipe', 'sp')
      .where('mp.mon_plan_id = :monPlanId', { monPlanId })
      .getRawOne();
    return row?.unitStackPipe ?? '';
  }
}
