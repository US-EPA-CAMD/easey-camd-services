jest.mock('@us-epa-camd/easey-common/connection', () => ({
  withSlaveConnection: jest.fn(),
}));

import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { BulkFileDTO } from '../dto/bulk_file.dto';
import { BulkFileInputDTO } from '../dto/bulk_file_input.dto';
import { BulkFileMap } from '../maps/bulk-file-map';
import { BulkFileMetadataRepository } from './bulk-file.repository';
import { BulkFileService } from './bulk-file.service';

const mockRepository = () => ({
  find: jest.fn(),
  findOneBy: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
});

const dto = new BulkFileDTO();
dto.filename = 'Test';
const mockMap = () => ({
  many: jest.fn().mockResolvedValue(''),
  one: jest.fn().mockResolvedValue(dto),
});

const mockWithSlaveConnection = require('@us-epa-camd/easey-common/connection').withSlaveConnection;

describe('-- Bulk File Service --', () => {
  let bulkFileService: BulkFileService;
  let bulkFileRepo: BulkFileMetadataRepository;

  beforeAll(async () => {
    mockWithSlaveConnection.mockImplementation(async (dataSource, operation) => {
      const mockManager = {
        query: jest.fn().mockResolvedValue([]),
        find: jest.fn().mockResolvedValue([]),
        findBy: jest.fn().mockResolvedValue([]),
        getRepository: jest.fn().mockReturnValue({
          find: jest.fn().mockResolvedValue([]),
          findBy: jest.fn().mockResolvedValue([]),
          createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      // Create a mock BulkFileMetadataRepository instance
      const MockedRepository = jest.fn().mockImplementation(() => ({
        find: jest.fn().mockResolvedValue([]),
        findBy: jest.fn().mockResolvedValue([]),
      }));

      // Temporarily replace the constructor in the service
      const originalConstructor = require('./bulk-file.repository').BulkFileMetadataRepository;
      require('./bulk-file.repository').BulkFileMetadataRepository = MockedRepository;

      try {
        return await operation(mockManager);
      } finally {
        // Restore original constructor
        require('./bulk-file.repository').BulkFileMetadataRepository = originalConstructor;
      }
    });
  });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      providers: [
        ConfigService,
        BulkFileService,
        { provide: BulkFileMap, useFactory: mockMap },
        { provide: BulkFileMetadataRepository, useFactory: mockRepository },
        { provide: DataSource, useValue:{} },
      ],
    }).compile();

    bulkFileRepo = module.get(BulkFileMetadataRepository);
    bulkFileService = module.get(BulkFileService);
  });

  it('should be defined', async () => {
    expect(bulkFileService).toBeDefined();
  });

  describe('getBulkDataFiles', () => {
    it('should return the proper data from map', async () => {
      expect(await bulkFileService.getBulkDataFiles()).toEqual('');
    });
  });

  describe('addBulkDataFile', () => {
    it('should add metadata for repo successfully given a found record', async () => {
      const params = new BulkFileInputDTO();
      const dto = new BulkFileDTO();

      jest.spyOn(bulkFileService, 'updateBulkDataFile').mockResolvedValue(dto);
      bulkFileRepo.findOneBy = jest.fn().mockResolvedValue(true);
      expect(await bulkFileService.addBulkDataFile(params)).toBe(dto);
    });

    it('should add metadata for repo successfully given a non-found record', async () => {
      const params = new BulkFileInputDTO();

      bulkFileRepo.findOneBy = jest.fn().mockResolvedValue(null);
      expect((await bulkFileService.addBulkDataFile(params)).filename).toEqual(
        'Test',
      );
    });
  });

  describe('updateBulkDataFile', () => {
    it('should update metadata for repo successfully', async () => {
      const params = new BulkFileInputDTO();

      expect(async () => {
        await bulkFileService.updateBulkDataFile('', params);
      }).not.toThrow();
    });
  });
});
