import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';
import { DataSource, EntityManager } from 'typeorm';

import {
  DeleteImportFilesDTO,
  ImportQueueRequestDTO,
  ProcessImportDTO,
} from '../dto/bulk-import.dto';
import { BulkImportController } from './bulk-import.controller';
import { BulkImportProcessService } from './bulk-import-process.service';
import { BulkImportService } from './bulk-import.service';

const SET_ID = 'set-123';

describe('BulkImportController', () => {
  let controller: BulkImportController;
  let service: any;
  let processService: any;

  beforeEach(async () => {
    service = {
      stageFiles: jest.fn(),
      deleteFiles: jest.fn(),
      queue: jest.fn(),
      getLatest: jest.fn(),
      getSet: jest.fn(),
    };
    processService = {
      processImportSet: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [BulkImportController],
      providers: [
        { provide: BulkImportService, useValue: service },
        { provide: BulkImportProcessService, useValue: processService },
        ConfigService,
        EntityManager,
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    controller = module.get<BulkImportController>(BulkImportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('stage() delegates to the service', async () => {
    const files = [{ originalname: 'a.json' }] as any;
    const staged = [{ fileName: 'a.json' }];
    service.stageFiles.mockResolvedValue(staged);

    expect(await controller.stage(SET_ID, files)).toBe(staged);
    expect(service.stageFiles).toHaveBeenCalledWith(SET_ID, files);
  });

  it('deleteFiles() forwards the requested s3Paths', async () => {
    const body: DeleteImportFilesDTO = { s3Paths: ['bulk-import/set-123/a.json'] };

    await controller.deleteFiles(SET_ID, body);

    expect(service.deleteFiles).toHaveBeenCalledWith(SET_ID, body.s3Paths);
  });

  it('deleteFiles() passes undefined when the body has no paths', async () => {
    await controller.deleteFiles(SET_ID, {} as DeleteImportFilesDTO);
    expect(service.deleteFiles).toHaveBeenCalledWith(SET_ID, undefined);
  });

  it('queue() unpacks the payload for the service', async () => {
    const user = { userId: 'u1' } as CurrentUser;
    const body: ImportQueueRequestDTO = {
      userEmail: 'user@example.com',
      items: [{ monPlanId: 'MP1' }] as any,
    };

    await controller.queue(SET_ID, body, user);

    expect(service.queue).toHaveBeenCalledWith(
      SET_ID,
      body.items,
      body.userEmail,
      user,
    );
  });

  it('process() kicks off processing for the set', async () => {
    const params: ProcessImportDTO = { importSetId: SET_ID };

    await controller.process(params);

    expect(processService.processImportSet).toHaveBeenCalledWith(SET_ID);
  });

  it('process() does not throw when processing rejects', async () => {
    processService.processImportSet.mockRejectedValue(new Error('boom'));
    await expect(
      controller.process({ importSetId: SET_ID }),
    ).resolves.not.toThrow();
  });

  it('getLatest() delegates using the current user id', async () => {
    const user = { userId: 'u1' } as CurrentUser;
    await controller.getLatest(user);
    expect(service.getLatest).toHaveBeenCalledWith('u1');
  });

  it('getSet() delegates to the service', async () => {
    await controller.getSet(SET_ID);
    expect(service.getSet).toHaveBeenCalledWith(SET_ID);
  });
});
