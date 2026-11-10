import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NodemailerService } from './nodemailer.service';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';

// Mock nodemailer
const mockTransporter = {
  sendMail: jest.fn(),
  verify: jest.fn(),
};

jest.mock('nodemailer', () => {
  const actualNodemailer = jest.requireActual('nodemailer');

  return {
    ...actualNodemailer,
    createTransport: jest.fn((options) =>
      options?.streamTransport
        ? actualNodemailer.createTransport(options)
        : mockTransporter,
    ),
  };
});

// Mock the config values
jest.mock('../../config/app.config', () => ({
  smtpHost: 'smtp.test.com',
  smtpPort: 587,
}));

const configValues = {
  'app.enableLocalEmailPreview': false,
  'app.env': 'test',
  'app.localEmailPreviewDirectory': undefined,
  'app.localEmailPreviewOpen': false,
};

const mockConfigService = {
  get: jest.fn((key: keyof typeof configValues) => configValues[key]),
};

describe('NodemailerService', () => {
  let service: NodemailerService;

  beforeEach(async () => {
    mockTransporter.sendMail.mockClear();
    mockTransporter.verify.mockResolvedValue(true);
    configValues['app.enableLocalEmailPreview'] = false;
    configValues['app.env'] = 'test';
    configValues['app.localEmailPreviewDirectory'] = undefined;
    configValues['app.localEmailPreviewOpen'] = false;

    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        NodemailerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<NodemailerService>(NodemailerService);
    // Initialize the service to create the transporter
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create transporter with provided options', () => {
    const transporter = service.getTransporter();
    expect(transporter).toBeDefined();
  });

  it('should send email', async () => {
    mockTransporter.sendMail.mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
      rejected: [],
    });

    const mailOptions = {
      from: 'sender@test.com',
      to: 'recipient@test.com',
      subject: 'Test Subject',
      text: 'Test message',
    };

    const result = await service.sendMail(mailOptions);

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(mailOptions);
    expect(result.messageId).toBe('test-message-id');
  });

  it('should preview email in local development', async () => {
    const previewDirectory = await mkdtemp(
      join(tmpdir(), 'easey-email-preview-'),
    );
    configValues['app.enableLocalEmailPreview'] = true;
    configValues['app.localEmailPreviewDirectory'] = previewDirectory;

    try {
      const result = await service.sendMail({
        from: 'sender@test.com',
        to: 'recipient@test.com',
        subject: 'Preview Subject',
        html: '<p>Preview message</p>',
      });

      const previewFiles = (await readdir(previewDirectory)).filter((file) =>
        file.endsWith('.html'),
      );
      expect(previewFiles).toHaveLength(1);
      await expect(
        readFile(join(previewDirectory, previewFiles[0]), 'utf8'),
      ).resolves.toContain('Preview message');
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
      expect(result.accepted).toEqual(['recipient@test.com']);
      expect(result.rejected).toEqual([]);
    } finally {
      await rm(previewDirectory, { recursive: true, force: true });
    }
  }, 30_000);
});
