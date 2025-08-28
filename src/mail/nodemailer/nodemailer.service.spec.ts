import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NodemailerService } from './nodemailer.service';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';

// Mock nodemailer
const mockTransporter = {
  sendMail: jest.fn(),
  verify: jest.fn(),
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

// Mock the config values
jest.mock('../../config/app.config', () => ({
  smtpHost: 'smtp.test.com',
  smtpPort: 587,
}));

const mockConfigService = {
  get: jest.fn((key: string) => {
    switch (key) {
      case 'app.enableLocalEmailPreview':
        return false;
      case 'app.env':
        return 'test';
      case 'app.localEmailPreviewDirectory':
        return '/tmp/test-previews';
      case 'app.localEmailPreviewOpen':
        return false;
      default:
        return undefined;
    }
  }),
};

describe('NodemailerService', () => {
  let service: NodemailerService;

  beforeEach(async () => {
    mockTransporter.sendMail.mockClear();
    mockTransporter.verify.mockResolvedValue(true);

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
});