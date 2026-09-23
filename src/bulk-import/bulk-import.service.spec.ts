import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { EntityManager } from 'typeorm';

import { ImportQueueRequestItemDTO } from '../dto/bulk-import.dto';
import { ImportFileType } from '../enums/import-file-type.enum';
import { BulkImportService } from './bulk-import.service';

const SET_ID = 'set-123';
const PREFIX = `bulk-import/${SET_ID}/`;

describe('BulkImportService', () => {
  let service: BulkImportService;
  let entityManager: any;
  let transactionManager: any;
  let s3Send: jest.Mock;

  beforeEach(async () => {
    transactionManager = {
      create: jest.fn((_entity, data) => data),
      save: jest.fn(),
    };
    entityManager = {
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      transaction: jest.fn(async (callback) => callback(transactionManager)),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkImportService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock-bucket') },
        },
        { provide: EntityManager, useValue: entityManager },
        {
          provide: Logger,
          useValue: { debug: jest.fn(), error: jest.fn(), log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<BulkImportService>(BulkImportService);

    // Replace the real S3 client created in the constructor with a stub.
    s3Send = jest.fn().mockResolvedValue({});
    (service as any).s3Client = { send: s3Send };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteFiles', () => {
    it('deletes only the given paths that belong to the set folder', async () => {
      await service.deleteFiles(SET_ID, [
        `${PREFIX}a.json`,
        `${PREFIX}b.json`,
        'bulk-import/other-set/c.json',
      ]);

      expect(s3Send).toHaveBeenCalledTimes(1);
      const command = s3Send.mock.calls[0][0];
      expect(command).toBeInstanceOf(DeleteObjectsCommand);
      expect(command.input.Delete.Objects).toEqual([
        { Key: `${PREFIX}a.json` },
        { Key: `${PREFIX}b.json` },
      ]);
    });

    it('does nothing when no given path is in the set folder', async () => {
      await service.deleteFiles(SET_ID, ['bulk-import/other-set/c.json']);
      expect(s3Send).not.toHaveBeenCalled();
    });

    it('lists and clears every staged object when no paths are given', async () => {
      s3Send
        .mockResolvedValueOnce({
          Contents: [{ Key: `${PREFIX}a.json` }, { Key: `${PREFIX}b.json` }],
          IsTruncated: false,
        });

      await service.deleteFiles(SET_ID, undefined);

      expect(s3Send.mock.calls[0][0]).toBeInstanceOf(ListObjectsV2Command);
      expect(s3Send.mock.calls[1][0]).toBeInstanceOf(DeleteObjectsCommand);
      expect(s3Send.mock.calls[1][0].input.Delete.Objects).toEqual([
        { Key: `${PREFIX}a.json` },
        { Key: `${PREFIX}b.json` },
      ]);
    });

    it('follows pagination when the listing is truncated', async () => {
      s3Send
        .mockResolvedValueOnce({
          Contents: [{ Key: `${PREFIX}a.json` }],
          IsTruncated: true,
          NextContinuationToken: 'token-2',
        })
        .mockResolvedValueOnce({}) // delete page 1
        .mockResolvedValueOnce({
          Contents: [{ Key: `${PREFIX}b.json` }],
          IsTruncated: false,
        })
        .mockResolvedValueOnce({}); // delete page 2

      await service.deleteFiles(SET_ID, undefined);

      expect(s3Send).toHaveBeenCalledTimes(4);
    });
  });

  describe('getStagedObject', () => {
    it('parses the JSON body of the staged object', async () => {
      s3Send.mockResolvedValue({
        Body: { transformToString: jest.fn().mockResolvedValue('{"orisCode":42}') },
      });

      const result = await service.getStagedObject(`${PREFIX}file.json`);

      expect(s3Send.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand);
      expect(result).toEqual({ orisCode: 42 });
    });
  });

  describe('queue', () => {
    it('rejects a queue request with no files', async () => {
      await expect(
        service.queue(SET_ID, [], 'user@example.com', {} as any),
      ).rejects.toThrow('Cannot submit an import with no files.');
      expect(entityManager.transaction).not.toHaveBeenCalled();
    });

    it.each([
      {
        scenario: 'prepare-only rights',
        roles: ['Preparer'],
        permissions: [],
        fileTypes: [ImportFileType.MP, ImportFileType.QA, ImportFileType.EM],
      },
      {
        scenario: 'Submit MP-only rights',
        roles: ['Submitter'],
        permissions: ['DSMP'],
        fileTypes: [ImportFileType.QA, ImportFileType.EM],
      },
      {
        scenario: 'Submit MP and QA rights',
        roles: ['Submitter'],
        permissions: ['DSMP', 'DSQA'],
        fileTypes: [ImportFileType.EM],
      },
    ])(
      'queues files for a user with $scenario after RoleGuard authorization',
      async ({ roles, permissions, fileTypes }) => {
        const items: ImportQueueRequestItemDTO[] = fileTypes.map(
          (fileType, index) => ({
            monPlanId: 'MP1',
            s3Path: `${PREFIX}${fileType}-${index}.json`,
            fileName: `${fileType}-${index}.json`,
            fileType,
            orisCode: 10,
          }),
        );
        const user: CurrentUser = {
          userId: 'user-1',
          sessionId: 'session-1',
          expiration: '',
          clientIp: '',
          roles,
          facilities: [{ facId: 1, orisCode: 10, permissions }],
        };

        await expect(
          service.queue(SET_ID, items, 'user@example.com', user),
        ).resolves.toBeUndefined();

        expect(entityManager.transaction).toHaveBeenCalledTimes(1);
        expect(transactionManager.save).toHaveBeenCalledTimes(items.length + 1);
      },
    );
  });

  describe('getSet', () => {
    it('throws NOT_FOUND when the set does not exist', async () => {
      entityManager.findOneBy.mockResolvedValue(null);
      await expect(service.getSet(SET_ID)).rejects.toThrow('Import set not found.');
    });
  });
});
