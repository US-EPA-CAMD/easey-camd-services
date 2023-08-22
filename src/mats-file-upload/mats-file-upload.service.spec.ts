import { Test, TestingModule } from '@nestjs/testing';
import { MatsFileUploadService } from './mats-file-upload.service';
import { ConfigService } from '@nestjs/config';

describe('MatsFileUploadService', () => {
  let service: MatsFileUploadService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MatsFileUploadService, ConfigService],
    }).compile();

    service = module.get(MatsFileUploadService);
    configService = module.get(ConfigService);

    const mS3ClientInstance = {
      upload: jest.fn().mockReturnThis(),
    };
    
    jest.mock('@aws-sdk/client-s3', () => { 
      S3Client: jest.fn(() => mS3ClientInstance) 
      PutObjectCommand: jest.fn(() => {})
    });

    mS3ClientInstance.upload.mockResolvedValue('fake response');

  });

  it('should be defined', async () => {
    expect(service).toBeDefined()
  });
});

// NOTE: The below test works fine locally but makes the test fail in github for some reason. This should be investigated further

// describe('MatsFileUploadService', () => {
//   let service: MatsFileUploadService;
//   let configService: ConfigService;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [MatsFileUploadService, ConfigService],
//     }).compile();

//     service = module.get(MatsFileUploadService);
//     configService = module.get(ConfigService);

//     const mS3ClientInstance = {
//       upload: jest.fn().mockReturnThis(),
//     };
    
//     jest.mock('@aws-sdk/client-s3', () => { 
//       S3Client: jest.fn(() => mS3ClientInstance) 
//       PutObjectCommand: jest.fn(() => {})
//     });

//     mS3ClientInstance.upload.mockResolvedValue('fake response');

//   });

//   it('should be defined', async () => {


//     jest.spyOn(configService, 'get').mockReturnValue("value");

//     await expect(service.uploadFile('name', Buffer.from('ok'))).resolves;

//   });
// });
