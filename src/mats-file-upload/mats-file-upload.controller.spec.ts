import { Test, TestingModule } from '@nestjs/testing';
import { MatsFileUploadController } from './mats-file-upload.controller';
import { ConfigService } from '@nestjs/config';
import { MatsFileUploadService } from './mats-file-upload.service';

const file = {
  originalname: 'sample.name',
  mimetype: 'application/pdf',
  path: 'sample.url',
  buffer: Buffer.from('test'),
  fieldname: 'sample.fieldname',
  encoding: 'sample.encoding',
  size: 1000,
  stream: null,
  destination: 'sample.destination',
  filename: 'sample.filename'
};

describe('MatsFileUploadController', () => {
  let controller: MatsFileUploadController;
  let service: MatsFileUploadService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatsFileUploadController],
      providers: [
        ConfigService,
        {
          provide: MatsFileUploadService,
          useValue: {
            uploadFile: jest.fn(),
            saveImportMetaData: jest.fn(),
          }
        }
      ]
    }).compile();

    controller = module.get(MatsFileUploadController);
    service = module.get(MatsFileUploadService);
    configService = module.get(ConfigService);


    const mS3ClientInstance = {
      upload: jest.fn().mockReturnThis(),
    };

    jest.mock('@aws-sdk/client-s3', () => {
      S3Client: jest.fn(() => mS3ClientInstance)
      PutObjectCommand: jest.fn(() => { })
    });
  });

  it('should be defined', async () => {
    jest.spyOn(configService, 'get').mockReturnValue("value");
    jest.spyOn(service, 'uploadFile').mockResolvedValue(null);
    jest.spyOn(service, 'saveImportMetaData').mockResolvedValue(null);

    await expect(controller.uploadFile(file, "monplanid", "testnum", null)).resolves;

  });

  it('Should fail if mime type is not pdf or xml', async () => {
    jest.spyOn(service, 'uploadFile').mockResolvedValue(null);
    jest.spyOn(service, 'saveImportMetaData').mockResolvedValue(null);


    const testFile = { ...file, mimetype: 'text/xml' };
    expect(controller.uploadFile(testFile, "monplanid", "testnum", null));

    testFile.mimetype = 'application/xml';
    expect(controller.uploadFile(testFile, "monplanid", "testnum", null));

    testFile.mimetype = 'application/pdf';
    expect(controller.uploadFile(testFile, "monplanid", "testnum", null));

    testFile.mimetype = 'image/png'
    expect(controller.uploadFile(testFile, "monplanid", "testnum", null)).rejects.toThrow();
  })

  it('Should fail if file size is > 30M', async () => {
    const testFile = { ...file, size: (30 * 1024 * 1024 + 1) };
    expect(controller.uploadFile(testFile, "monplanid", "testnum", null)).rejects.toThrow();
  })
});
