import { Test } from '@nestjs/testing';
import { BulkFileService } from './bulk-file.service';
import { BulkFileController } from './bulk-file.controller';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BulkFileCopyParamsDTO } from '../dto/bulk-file-copy.params.dto';
import { BulkFileInputDTO } from '../dto/bulk_file_input.dto';

jest.mock('./bulk-file.service');

describe('-- Bulk File Controller --', () => {
  let bulkFileController: BulkFileController;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [BulkFileController],
      providers: [ConfigService, BulkFileService],
    }).compile();

    bulkFileController = module.get(BulkFileController);
  });

  it('should be defined', async () => {
    expect(bulkFileController).toBeDefined();
  });

  it('getBulkFiles', async () => {
    expect(async () => {
      await bulkFileController.getBulkFiles();
    }).not.toThrowError();
  });

  it('gaftp-copy', async () => {
    expect(async () => {
      await bulkFileController.copyBulkFiles(new BulkFileCopyParamsDTO());
    }).not.toThrowError();
  });

  it('addBulkFile', async () => {
    expect(async () => {
      await bulkFileController.addBulkFile(new BulkFileInputDTO());
    }).not.toThrowError();
  });

  it('updateBulkFile', async () => {
    expect(async () => {
      await bulkFileController.updateBulkFile('', new BulkFileInputDTO());
    }).not.toThrowError();
  });
});
