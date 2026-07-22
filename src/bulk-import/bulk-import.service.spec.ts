import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@us-epa-camd/easey-common/logger';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { EntityManager } from 'typeorm';

import { BulkImportService } from './bulk-import.service';

const SET_ID = 'set-123';
const PREFIX = `bulk-import/${SET_ID}/`;

describe('BulkImportService', () => {
  let service: BulkImportService;
  let entityManager: any;
  let s3Send: jest.Mock;

  beforeEach(async () => {
    entityManager = {
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      transaction: jest.fn(),
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

  describe('submit', () => {
    it('rejects a submit with no files', async () => {
      await expect(
        service.submit(SET_ID, [], 'user@example.com', {} as any),
      ).rejects.toThrow('Cannot submit an import with no files.');
      expect(entityManager.transaction).not.toHaveBeenCalled();
    });
  });

  describe('getSet', () => {
    it('throws NOT_FOUND when the set does not exist', async () => {
      entityManager.findOneBy.mockResolvedValue(null);
      await expect(service.getSet(SET_ID)).rejects.toThrow('Import set not found.');
    });
  });
});
