import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';
import { firstValueFrom } from 'rxjs';
import { EntityManager, IsNull, Not } from 'typeorm';

import { ClientTokenService } from '../client-token/client-token.service';
import { ImportQueue } from '../entities/import-queue.entity';
import { ImportSet } from '../entities/import-set.entity';
import { ImportFileType } from '../enums/import-file-type.enum';
import { BulkImportService } from './bulk-import.service';

// Processing order within a set: plan, then QA, then emissions.
const FILE_TYPE_ORDER: Record<string, number> = {
  [ImportFileType.MP]: 1,
  [ImportFileType.QA]: 2,
  [ImportFileType.EM]: 3,
};

@Injectable()
export class BulkImportProcessService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
    private readonly bulkImportService: BulkImportService,
    private readonly clientTokenService: ClientTokenService,
  ) {
    this.logger.setContext(BulkImportProcessService.name);
  }

  // Imports each staged file in a claimed set, recording per-file errors on the queue rows.
  async processImportSet(importSetId: string): Promise<void> {
    this.logger.log(`Processing import set: ${importSetId}`);

    // Atomic CLAIMED -> WIP transition; bail if another worker already took it.
    const claim = await this.entityManager.update(
      ImportSet,
      { importSetId, claimedTime: Not(IsNull()), startedTime: IsNull() },
      { startedTime: currentDateTime() },
    );
    if (claim.affected === 0) {
      this.logger.warn(
        `Import set ${importSetId} is not claimed / already processing; skipping.`,
      );
      return;
    }

    const set = await this.entityManager.findOneBy(ImportSet, { importSetId });
    if (!set) {
      throw new Error(`Import set ${importSetId} not found after claim.`);
    }

    let rows: ImportQueue[] = [];
    try {
      rows = await this.entityManager.findBy(ImportQueue, { importSetId });
      rows.sort(
        (a, b) =>
          (FILE_TYPE_ORDER[a.fileTypeCode] ?? 99) -
          (FILE_TYPE_ORDER[b.fileTypeCode] ?? 99),
      );

      for (const row of rows) {
        await this.processRow(row, set.userId);
      }

      // Run finished: mark the set COMPLETE regardless of per-row outcomes.
      set.completedTime = currentDateTime();
      await this.entityManager.save(set);

      this.logger.log(`Completed import set: ${importSetId}`);
    } catch (err) {
      // Process-level failure marks the set ERROR.
      this.logger.error(
        `Error processing import set ${importSetId}`,
        err?.stack,
      );
      set.note = err?.message ?? 'Unknown error processing import set.';
      set.noteTime = currentDateTime();
      await this.entityManager.save(set);
      await this.errorQueueRows(rows, set.note);
    } finally {
      // Always clean up staged S3 files, even on failure; a cleanup error must
      // not mask the set outcome, so swallow it after logging.
      try {
        await this.bulkImportService.deleteFiles(importSetId, undefined);
      } catch (cleanupErr) {
        this.logger.error(
          `Failed to delete S3 files for import set ${importSetId}`,
          cleanupErr?.stack,
        );
      }
    }
  }

  // Propagate a set-level ERROR to any queue rows not already in a terminal state.
  private async errorQueueRows(rows: ImportQueue[], note: string): Promise<void> {
    for (const row of rows) {
      if (row.completedTime || row.noteTime) continue;
      row.note = note;
      row.noteTime = currentDateTime();
      await this.entityManager.save(row);
    }
  }

  // Imports a single staged file, moving the row QUEUED -> WIP -> COMPLETE/ERROR.
  private async processRow(row: ImportQueue, userId: string): Promise<void> {
    // Mint a fresh token per file so long-running sets never hit token expiry.
    const headers = await this.buildRequestHeaders();

    const now = currentDateTime();
    row.claimedTime = now;
    row.startedTime = now;
    await this.entityManager.save(row);

    try {
      const payload = await this.bulkImportService.getStagedObject(
        row.tempS3BucketFilePath,
      );
      await this.importFile(row.fileTypeCode, payload, userId, headers);
      row.completedTime = currentDateTime();
      await this.entityManager.save(row);
    } catch (err) {
      row.note = this.extractErrorMessages(err);
      row.noteTime = currentDateTime();
      await this.entityManager.save(row);
      this.logger.warn(
        `Import failed for ${row.fileName} (import_id ${row.importId}): ${row.note}`,
      );
    }
  }

  // Auth headers for the outbound import call; the client token is skipped when disabled (local testing).
  private async buildRequestHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.configService.get<boolean>('app.enableClientToken')) {
      const clientToken = await this.clientTokenService.getClientToken();
      if (!clientToken) {
        throw new Error('Unable to obtain client token for bulk import.');
      }
      Object.assign(headers, this.clientTokenService.buildAuthHeaders(clientToken));
    }
    return headers;
  }

  private async importFile(
    fileType: string,
    payload: any,
    userId: string,
    headers: Record<string, string>,
  ): Promise<void> {
    const url = this.buildImportUrl(fileType, userId);
    await firstValueFrom(this.httpService.post(url, payload, { headers }));
  }

  private buildImportUrl(fileType: string, userId: string): string {
    const user = `userId=${encodeURIComponent(userId)}`;
    switch (fileType) {
      case ImportFileType.MP:
        return `${this.configService.get<string>(
          'app.monitorPlanApi',
        )}/workspace/plans/import/bulk?draft=false&${user}`;
      case ImportFileType.QA:
        return `${this.configService.get<string>(
          'app.qaCertificationApi',
        )}/workspace/import/bulk?${user}`;
      case ImportFileType.EM:
        return `${this.configService.get<string>(
          'app.emissionsApi',
        )}/workspace/emissions/import/bulk?${user}`;
      default:
        throw new Error(`Unrecognized import file type: ${fileType}`);
    }
  }

  private extractErrorMessages(err: any): string {
    const data = err?.response?.data;
    if (data) {
      if (Array.isArray(data.message)) return data.message.join('\n');
      if (typeof data.message === 'string') return data.message;
      if (Array.isArray(data.errors)) {
        return data.errors.map((e: any) => e?.message ?? String(e)).join('\n');
      }
      if (Array.isArray(data)) {
        return data.map((d: any) => d?.message ?? JSON.stringify(d)).join('\n');
      }
      if (typeof data === 'string') return data;
      return JSON.stringify(data);
    }
    return err?.message ?? 'Unknown import error';
  }
}
