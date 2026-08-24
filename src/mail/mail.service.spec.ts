import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@us-epa-camd/easey-common/logger';

import { ClientConfigService } from './client-config.service';
import { EaseyContentTemplateService } from './easey-content-template.service';
import { EmailToSendService } from './email-to-send.service';
import { MailService } from './mail.service';
import { NodemailerService } from './nodemailer/nodemailer.service';

const mockNodemailerService = {
  sendMail: jest.fn(),
};

const mockEaseyContentTemplateService = {
  getTemplateById: jest.fn(),
  renderCustomTemplate: jest.fn(),
  renderHandlebarsTemplate: jest.fn(),
};

const mockEmailToSendService = {
  findEmailToSendRecord: jest.fn(),
  findEmailAttachments: jest.fn(),
  markEmailToSendComplete: jest.fn(),
  markEmailToSendFailed: jest.fn(),
};

const mockLogger = {
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

describe('MailService queued email attachments', () => {
  let service: MailService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockEmailToSendService.findEmailToSendRecord.mockResolvedValue({
      toSendIdentifier: 42,
      toEmail: 'recipient@example.com',
      fromEmail: 'sender@example.com',
      templateIdentifier: 100,
      context: '{"message":"test"}',
      statusCode: 'WIP',
    });
    mockEaseyContentTemplateService.getTemplateById.mockResolvedValue({
      templateLocation: 'templates/email/test.hbs',
      templateSubject: 'Test subject',
    });
    mockEaseyContentTemplateService.renderHandlebarsTemplate.mockResolvedValue(
      '<p>Test email</p>',
    );
    mockNodemailerService.sendMail.mockResolvedValue(undefined);

    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: NodemailerService,
          useValue: mockNodemailerService,
        },
        {
          provide: EaseyContentTemplateService,
          useValue: mockEaseyContentTemplateService,
        },
        {
          provide: EmailToSendService,
          useValue: mockEmailToSendService,
        },
        {
          provide: ClientConfigService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('production'),
          },
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get(MailService);
  });

  it('preserves queued email behavior when no attachments exist', async () => {
    mockEmailToSendService.findEmailAttachments.mockResolvedValue([]);

    await expect(service.sendEmailToSendRecord(42)).resolves.toEqual({
      success: true,
    });
    expect(mockNodemailerService.sendMail).toHaveBeenCalledWith({
      to: 'recipient@example.com',
      from: 'sender@example.com',
      subject: 'Test subject',
      html: '<p>Test email</p>',
      attachments: undefined,
    });
  });

  it('includes all stored attachments without modifying their content', async () => {
    mockEmailToSendService.findEmailAttachments.mockResolvedValue([
      {
        emailAttachmentIdentifier: 1,
        toSendIdentifier: 42,
        emailAttachmentName: 'first.txt',
        emailAttachmentContent: 'first [[unmodified]] attachment',
      },
      {
        emailAttachmentIdentifier: 2,
        toSendIdentifier: 42,
        emailAttachmentName: 'second.html',
        emailAttachmentContent: '<p>{{unmodified}}</p>',
      },
    ]);

    await expect(service.sendEmailToSendRecord(42)).resolves.toEqual({
      success: true,
    });
    expect(mockNodemailerService.sendMail).toHaveBeenCalledWith({
      to: 'recipient@example.com',
      from: 'sender@example.com',
      subject: 'Test subject',
      html: '<p>Test email</p>',
      attachments: [
        {
          filename: 'first.txt',
          content: 'first [[unmodified]] attachment',
        },
        {
          filename: 'second.html',
          content: '<p>{{unmodified}}</p>',
        },
      ],
    });
    expect(mockEmailToSendService.markEmailToSendComplete).toHaveBeenCalledWith(
      42,
    );
  });

  it('skips invalid attachments while sending all valid siblings', async () => {
    mockEmailToSendService.findEmailAttachments.mockResolvedValue([
      {
        emailAttachmentIdentifier: 1,
        emailAttachmentName: 'first.txt',
        emailAttachmentContent: 'first attachment',
      },
      {
        emailAttachmentIdentifier: 2,
        emailAttachmentName: null,
        emailAttachmentContent: 'missing name',
      },
      {
        emailAttachmentIdentifier: 3,
        emailAttachmentName: 'empty.txt',
        emailAttachmentContent: '   ',
      },
      {
        emailAttachmentIdentifier: 4,
        emailAttachmentName: 'fourth.txt',
        emailAttachmentContent: 'fourth attachment',
      },
      {
        emailAttachmentIdentifier: 5,
        emailAttachmentName: 'fifth.txt',
        emailAttachmentContent: 'fifth attachment',
      },
    ]);

    await expect(service.sendEmailToSendRecord(42)).resolves.toEqual({
      success: true,
    });
    expect(mockNodemailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          {
            filename: 'first.txt',
            content: 'first attachment',
          },
          {
            filename: 'fourth.txt',
            content: 'fourth attachment',
          },
          {
            filename: 'fifth.txt',
            content: 'fifth attachment',
          },
        ],
      }),
    );
    expect(mockLogger.warn).toHaveBeenCalledTimes(2);
  });

  it('skips a null attachment row without blocking valid attachments', async () => {
    mockEmailToSendService.findEmailAttachments.mockResolvedValue([
      null,
      {
        emailAttachmentIdentifier: 2,
        emailAttachmentName: 'valid.txt',
        emailAttachmentContent: 'valid attachment',
      },
    ]);

    await expect(service.sendEmailToSendRecord(42)).resolves.toEqual({
      success: true,
    });
    expect(mockNodemailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          {
            filename: 'valid.txt',
            content: 'valid attachment',
          },
        ],
      }),
    );
    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
  });

  it('sends without attachments when the attachment lookup returns invalid data', async () => {
    mockEmailToSendService.findEmailAttachments.mockResolvedValue(undefined);

    await expect(service.sendEmailToSendRecord(42)).resolves.toEqual({
      success: true,
    });
    expect(mockNodemailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: undefined,
      }),
    );
    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
  });

  it('sends without attachments when attachment loading fails', async () => {
    mockEmailToSendService.findEmailAttachments.mockRejectedValue(
      new Error('attachment query failed'),
    );

    await expect(service.sendEmailToSendRecord(42)).resolves.toEqual({
      success: true,
    });
    expect(mockNodemailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: undefined,
      }),
    );
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Sending email without attachments'),
      expect.any(Error),
    );
  });
});
