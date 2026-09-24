import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { of } from 'rxjs';
import { EntityManager } from 'typeorm';

import { ClientTokenService } from '../client-token/client-token.service';
import { ImportFileType } from '../enums/import-file-type.enum';
import { BulkImportService } from './bulk-import.service';
import { BulkImportProcessService } from './bulk-import-process.service';

const SET_ID = 'set-123';

// Minimal import_queue row shape used by the service under test.
const makeRow = (overrides: Partial<any> = {}): any => ({
  importId: 1,
  importSetId: SET_ID,
  fileName: 'file.json',
  fileTypeCode: ImportFileType.MP,
  tempS3BucketFilePath: `bulk-import/${SET_ID}/file.json`,
  ...overrides,
});

describe('BulkImportProcessService', () => {
  let service: BulkImportProcessService;
  let entityManager: any;
  let httpService: any;
  let bulkImportService: any;
  let clientTokenService: any;
  let logger: any;

  beforeEach(async () => {
    entityManager = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findOneBy: jest.fn(),
      findBy: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
    };
    httpService = {
      post: jest.fn().mockReturnValue(of({ data: {} })),
    };
    bulkImportService = {
      getStagedObject: jest.fn().mockResolvedValue({ some: 'payload' }),
      deleteFiles: jest.fn().mockResolvedValue(undefined),
    };
    clientTokenService = {
      getClientToken: jest.fn().mockResolvedValue('mockToken'),
      buildAuthHeaders: jest.fn().mockReturnValue({}),
    };
    logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn(), setContext: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkImportProcessService,
        { provide: EntityManager, useValue: entityManager },
        { provide: HttpService, useValue: httpService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'app.enableClientToken':
                  return false;
                case 'app.monitorPlanApi':
                  return 'http://mp-api';
                case 'app.qaCertificationApi':
                  return 'http://qa-api';
                case 'app.emissionsApi':
                  return 'http://em-api';
                default:
                  return null;
              }
            }),
          },
        },
        { provide: Logger, useValue: logger },
        { provide: BulkImportService, useValue: bulkImportService },
        { provide: ClientTokenService, useValue: clientTokenService },
      ],
    }).compile();

    service = module.get<BulkImportProcessService>(BulkImportProcessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('skips when the set cannot be claimed', async () => {
    entityManager.update.mockResolvedValue({ affected: 0 });

    await service.processImportSet(SET_ID);

    expect(logger.warn).toHaveBeenCalled();
    expect(entityManager.findOneBy).not.toHaveBeenCalled();
    expect(bulkImportService.deleteFiles).not.toHaveBeenCalled();
  });

  it('throws when the set is missing after a successful claim', async () => {
    entityManager.findOneBy.mockResolvedValue(null);

    await expect(service.processImportSet(SET_ID)).rejects.toThrow(
      `Import set ${SET_ID} not found after claim.`,
    );
  });

  it('processes rows in MP -> QA -> EM order and completes the set', async () => {
    const set: any = { importSetId: SET_ID, userId: 'user-1' };
    entityManager.findOneBy.mockResolvedValue(set);
    entityManager.findBy.mockResolvedValue([
      makeRow({ importId: 3, fileTypeCode: ImportFileType.EM, tempS3BucketFilePath: 'em' }),
      makeRow({ importId: 1, fileTypeCode: ImportFileType.MP, tempS3BucketFilePath: 'mp' }),
      makeRow({ importId: 2, fileTypeCode: ImportFileType.QA, tempS3BucketFilePath: 'qa' }),
    ]);

    await service.processImportSet(SET_ID);

    const stagedOrder = bulkImportService.getStagedObject.mock.calls.map((c) => c[0]);
    expect(stagedOrder).toEqual(['mp', 'qa', 'em']);
    expect(set.completedTime).toBeDefined();
    expect(entityManager.save).toHaveBeenCalledWith(set);
    expect(bulkImportService.deleteFiles).toHaveBeenCalledWith(SET_ID, undefined);
  });

  it('routes each file type to its API endpoint', async () => {
    entityManager.findOneBy.mockResolvedValue({ importSetId: SET_ID, userId: 'u' });
    entityManager.findBy.mockResolvedValue([
      makeRow({ fileTypeCode: ImportFileType.MP }),
      makeRow({ fileTypeCode: ImportFileType.QA }),
      makeRow({ fileTypeCode: ImportFileType.EM }),
    ]);

    await service.processImportSet(SET_ID);

    const urls = httpService.post.mock.calls.map((c) => c[0]);
    expect(urls).toEqual([
      'http://mp-api/workspace/plans/import/bulk?draft=false&userId=u',
      'http://qa-api/workspace/import/bulk?userId=u',
      'http://em-api/workspace/emissions/import/bulk?userId=u',
    ]);
  });

  it('records a per-row error without failing the whole set', async () => {
    const set: any = { importSetId: SET_ID, userId: 'u' };
    const row = makeRow();
    entityManager.findOneBy.mockResolvedValue(set);
    entityManager.findBy.mockResolvedValue([row]);
    httpService.post.mockImplementation(() => {
      throw { response: { data: { message: 'bad file' } } };
    });

    await service.processImportSet(SET_ID);

    expect(row.note).toBe('bad file');
    expect(row.noteTime).toBeDefined();
    // Set-level completion still happens; per-row failures are not fatal.
    expect(set.completedTime).toBeDefined();
    expect(bulkImportService.deleteFiles).toHaveBeenCalledWith(SET_ID, undefined);
  });

  it('marks the set ERROR and still deletes S3 files when processing fails', async () => {
    const set: any = { importSetId: SET_ID, userId: 'u' };
    entityManager.findOneBy.mockResolvedValue(set);
    entityManager.findBy.mockRejectedValue(new Error('db exploded'));

    await service.processImportSet(SET_ID);

    expect(set.note).toBe('db exploded');
    expect(set.noteTime).toBeDefined();
    expect(set.completedTime).toBeUndefined();
    expect(bulkImportService.deleteFiles).toHaveBeenCalledWith(SET_ID, undefined);
  });

  it('swallows S3 cleanup failures so they do not mask the outcome', async () => {
    entityManager.findOneBy.mockResolvedValue({ importSetId: SET_ID, userId: 'u' });
    entityManager.findBy.mockResolvedValue([]);
    bulkImportService.deleteFiles.mockRejectedValue(new Error('s3 down'));

    await expect(service.processImportSet(SET_ID)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      `Failed to delete S3 files for import set ${SET_ID}`,
      expect.anything(),
    );
  });
});
