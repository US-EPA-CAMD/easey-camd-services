import { Test, TestingModule } from '@nestjs/testing';
import { MatsFileUploadService } from './mats-file-upload.service';
import { ConfigService } from '@nestjs/config';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { TestTypeCode } from '../entities/test-type-code.entity';
import { MatsBulkFile } from '../entities/mats-bulk-file.entity';
import { Plant } from '../entities/plant.entity';

jest.mock('@aws-sdk/client-s3');

describe('MatsFileUploadService', () => {
  let service: MatsFileUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService, MatsFileUploadService],
    }).compile();

    service = module.get(MatsFileUploadService);
  });

  it('should be defined', async () => {
    expect(service).not.toBeNull();
  });

  it('Should call into s3 to upload a file without error', async () => {
    expect(async () => {
      await service.uploadFile(Buffer.from('mock'), '');
    }).not.toThrowError();
  });

  it('Should go through the process of the importFile procedure correctly', async () => {
    const mockSave = jest.fn();

    const mockPlan: MonitorPlan = { plant: new Plant() } as any;
    const testTypecode: TestTypeCode = { testTypeCodeDescription: '' } as any;

    jest.spyOn(MonitorPlan, 'findOne').mockResolvedValue(mockPlan);
    jest.spyOn(TestTypeCode, 'findOneBy').mockResolvedValue(testTypecode);
    jest.spyOn(service, 'uploadFile').mockResolvedValue(null);

    jest.spyOn(MatsBulkFile, 'create').mockReturnValue(null);
    jest.spyOn(MatsBulkFile, 'save').mockImplementation(mockSave);

    const file: Express.Multer.File = {
      buffer: Buffer.from(''),
      originalname: 'mock',
    } as any;

    await service.importFile(file, '', '', '', '', '');
    expect(mockSave).toHaveBeenCalled();
  });
});
