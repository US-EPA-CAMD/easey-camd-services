import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { promises as fsPromises } from 'fs';
import { MatsFileUploadService } from './mats-file-upload.service';
import { ConfigService } from '@nestjs/config';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { TestTypeCode } from '../entities/test-type-code.entity';
import { Plant } from '../entities/plant.entity';
import { DocumentService } from '../submission/document.service';
import { RecipientListService } from '../submission/recipient-list.service';
import { MailService } from '../mail/mail.service';
import { ClientConfigService } from '../mail/client-config.service';
import { LoggerModule } from '@us-epa-camd/easey-common';
import { EvaluationSetHelperService } from '../evaluation/evaluation-set-helper.service';


jest.mock('@aws-sdk/client-s3');

describe('MatsFileUploadService', () => {
  let service: MatsFileUploadService;
  let entityManager: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [ConfigService,
        MatsFileUploadService,
        EntityManager,
        {
          provide: RecipientListService,
          useValue: {
            getEmailRecipients: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendTemplateEmail: jest.fn(),
          },
        },
        {
          provide: DocumentService,
          useValue: {
            addCertificationStatements: jest.fn(),
            sendForSigning: jest.fn(),
          },
        },
        {
          provide: EvaluationSetHelperService,
          useValue: {},
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
        {
          provide: ClientConfigService,
          useValue: {
            getECMPSClientConfig: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(MatsFileUploadService);
    entityManager = module.get(EntityManager);
  });

  const buildMatsProcessParams = () =>
    ({
      matsDataSubmissionId: 1,
      userId: 'test-user',
      firstName: 'Test',
      lastName: 'User',
      middleInitial: 'Q',
      activityDescription: 'Testing MATS submission',
      htmlMetadataReport: '<html>metadata</html>',
    }) as any;

  const buildRequest = () =>
    ({
      headers: {
        authorization: 'Bearer test-token',
        'x-forwarded-for': '127.0.0.1',
      },
      ip: '127.0.0.1',
    }) as any;

  const setupMatsSubmissionProcessMocks = () => {
    const submission = {
      matsDataSubId: 1,
      monPlanId: 'plan-1',
      userId: 'test-user',
      userEmail: 'test@example.com',
      facId: 1,
      monLocId: 'loc-1',
    } as any;

    const payloadFile = {
      matsDataSubId: 1,
      fileName: 'payload.json',
      tempS3BucketFilePath: 'imports/payload.json',
    } as any;

    jest.spyOn(entityManager, 'findOne').mockResolvedValue(submission);
    jest.spyOn(entityManager, 'find').mockResolvedValue([payloadFile]);
    jest
      .spyOn(entityManager, 'save')
      .mockImplementation(async (entity: any) => entity);

    jest
      .spyOn(service['documentService'], 'addCertificationStatements')
      .mockImplementation(async (_monPlanId: string, documents: any[]) => {
        documents.push({
          documentTitle: 'Certification',
          context: '<html>certification</html>',
        });
      });

    jest
      .spyOn(service as any, 'createActivity')
      .mockResolvedValue({ activityId: 'activity-1' });

    jest
      .spyOn(service['documentService'], 'sendForSigning')
      .mockResolvedValue(undefined);

    jest
      .spyOn(service, 'sendMatsSubmissionConfirmation')
      .mockResolvedValue(undefined);

    service['importS3Client'] = {
      send: jest.fn().mockResolvedValue({
        Body: {
          transformToByteArray: jest
            .fn()
            .mockResolvedValue(Buffer.from('payload contents')),
        },
      }),
    } as any;

    service['mainS3Client'] = {
      send: jest.fn().mockResolvedValue({}),
    } as any;

    return { submission, payloadFile };
  };

  it('should be defined', async () => {
    expect(service).not.toBeNull();
  });

  it('Should call into s3 to upload a file without error', async () => {
    expect(async () => {
      await service.uploadFile(Buffer.from('mock'), '');
    }).not.toThrow();
  });

  it('Should go through the process of the importFile procedure correctly', async () => {
    const mockSave = jest.fn();

    const mockPlan: MonitorPlan = { plant: new Plant() } as any;
    const testTypecode: TestTypeCode = { testTypeCodeDescription: '' } as any;

    jest.spyOn(entityManager, 'findOne').mockResolvedValue(mockPlan);
    jest.spyOn(entityManager, 'findOneBy').mockResolvedValue(testTypecode);
    jest.spyOn(service, 'uploadFile').mockResolvedValue(null);

    jest.spyOn(entityManager, 'create').mockReturnValue(null);
    jest.spyOn(entityManager, 'save').mockImplementation(mockSave);

    const file: Express.Multer.File = {
      buffer: Buffer.from(''),
      originalname: 'mock',
    } as any;

    await service.importFile(file, '', '', '', '', '');
    expect(mockSave).toHaveBeenCalled();
  });

  it('Should remove the temp folder after a successful MATS submission process', async () => {
    setupMatsSubmissionProcessMocks();
    const rmSpy = jest.spyOn(fsPromises, 'rm');

    await expect(
      service.matsSubmissionProcess(buildMatsProcessParams(), buildRequest()),
    ).resolves.toBeUndefined();

    expect(rmSpy).toHaveBeenCalledWith(
      expect.stringContaining('mats-'),
      expect.objectContaining({
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      }),
    );
  });

  it('Should remove the temp folder when MATS submission processing fails', async () => {
    setupMatsSubmissionProcessMocks();
    const processingError = Object.assign(new Error('signing failed'), {
      status: 500,
    });
    const rmSpy = jest.spyOn(fsPromises, 'rm');

    jest
      .spyOn(service['documentService'], 'sendForSigning')
      .mockRejectedValue(processingError);

    await expect(
      service.matsSubmissionProcess(buildMatsProcessParams(), buildRequest()),
    ).rejects.toHaveProperty('message', 'signing failed');

    expect(rmSpy).toHaveBeenCalledWith(
      expect.stringContaining('mats-'),
      expect.objectContaining({
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      }),
    );
  });

  it('Should preserve the original processing error when temp folder cleanup fails', async () => {
    setupMatsSubmissionProcessMocks();
    const processingError = Object.assign(new Error('signing failed'), {
      status: 500,
    });
    const cleanupError = new Error('cleanup failed');
    const loggerErrorSpy = jest
      .spyOn(service['logger'], 'error')
      .mockImplementation(jest.fn());

    jest
      .spyOn(service['documentService'], 'sendForSigning')
      .mockRejectedValue(processingError);

    jest.spyOn(fsPromises, 'rm').mockRejectedValue(cleanupError);

    await expect(
      service.matsSubmissionProcess(buildMatsProcessParams(), buildRequest()),
    ).rejects.toHaveProperty('message', 'signing failed');

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('MATS temp folder cleanup failed'),
    );
  });
});
