import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { BulkFileDTO } from '../dto/bulk_file.dto';
import { BulkFileInputDTO } from '../dto/bulk_file_input.dto';
import { BulkFileMap } from '../maps/bulk-file-map';
import { BulkFileMetadataRepository } from './bulk-file.repository';
import { BulkFileService } from './bulk-file.service';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
});

const dto = new BulkFileDTO();
dto.filename = 'Test';
const mockMap = () => ({
  many: jest.fn().mockResolvedValue(''),
  one: jest.fn().mockResolvedValue(dto),
});

describe('-- Bulk File Service --', () => {
  let bulkFileService: BulkFileService;
  let bulkFileRepo: BulkFileMetadataRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      providers: [
        ConfigService,
        BulkFileService,
        { provide: BulkFileMap, useFactory: mockMap },
        { provide: BulkFileMetadataRepository, useFactory: mockRepository },
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
      bulkFileRepo.findOne = jest.fn().mockResolvedValue(true);
      expect(await bulkFileService.addBulkDataFile(params)).toBe(dto);
    });

    it('should add metadata for repo successfully given a non-found record', async () => {
      const params = new BulkFileInputDTO();

      bulkFileRepo.findOne = jest.fn().mockResolvedValue(null);
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
      }).not.toThrowError();
    });
  });
});
