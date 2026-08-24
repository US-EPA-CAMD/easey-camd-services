import { Test } from '@nestjs/testing';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { EntityManager } from 'typeorm';

import { EmailAttachment } from '../entities/email-attachment.entity';
import { EmailToSendService } from './email-to-send.service';

const mockEntityManager = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
};

describe('EmailToSendService', () => {
  let service: EmailToSendService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        EmailToSendService,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(EmailToSendService);
  });

  it('finds attachments for an email ordered by attachment ID', async () => {
    const attachments = [
      {
        emailAttachmentIdentifier: 1,
        toSendIdentifier: 42,
        emailAttachmentName: 'first.txt',
        emailAttachmentContent: 'first attachment',
      },
      {
        emailAttachmentIdentifier: 2,
        toSendIdentifier: 42,
        emailAttachmentName: 'second.txt',
        emailAttachmentContent: 'second attachment',
      },
    ];
    mockEntityManager.find.mockResolvedValue(attachments);

    await expect(service.findEmailAttachments(42)).resolves.toBe(attachments);
    expect(mockEntityManager.find).toHaveBeenCalledWith(EmailAttachment, {
      where: { toSendIdentifier: 42 },
      order: { emailAttachmentIdentifier: 'ASC' },
    });
  });
});
