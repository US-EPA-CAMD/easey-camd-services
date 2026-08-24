import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { EmailToSend } from '../entities/email-to-send.entity';
import { EmailAttachment } from '../entities/email-attachment.entity';

@Injectable()
export class EmailToSendService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly logger: Logger,
  ) {}

  /**
   * Find EmailToSend record by ID
   * @param emailToSendId Database record ID
   * @returns EmailToSend record or null if not found
   */
  async findEmailToSendRecord(emailToSendId: number): Promise<EmailToSend | null> {
    return await this.entityManager.findOne(EmailToSend, {
      where: { toSendIdentifier: emailToSendId }
    });
  }

  /**
   * Find attachment records for an EmailToSend record
   * @param emailToSendId Database EmailToSend record ID
   * @returns Attachment records ordered by ID
   */
  async findEmailAttachments(emailToSendId: number): Promise<EmailAttachment[]> {
    return await this.entityManager.find(EmailAttachment, {
      where: { toSendIdentifier: emailToSendId },
      order: { emailAttachmentIdentifier: 'ASC' },
    });
  }

  /**
   * Mark EmailToSend record as complete
   * @param emailToSendId Database record ID
   */
  async markEmailToSendComplete(emailToSendId: number): Promise<void> {
    const emailRecord = await this.findEmailToSendRecord(emailToSendId);
    
    if (emailRecord) {
      emailRecord.statusCode = 'COMPLETE';
      await this.entityManager.save(emailRecord);
      this.logger.debug(`EmailToSend record ${emailToSendId} marked as complete`);
    } else {
      this.logger.warn(`EmailToSend record ${emailToSendId} not found when marking complete`);
    }
  }

  /**
   * Mark EmailToSend record as failed
   * @param emailToSendId Database record ID
   * @param errorMessage Error message to log
   */
  async markEmailToSendFailed(emailToSendId: number, errorMessage: string): Promise<void> {
    const emailRecord = await this.findEmailToSendRecord(emailToSendId);
    
    if (emailRecord) {
      emailRecord.statusCode = 'ERROR';
      await this.entityManager.save(emailRecord);
      this.logger.error(`EmailToSend record ${emailToSendId} marked as failed: ${errorMessage}`);
    } else {
      this.logger.warn(`EmailToSend record ${emailToSendId} not found when marking failed`);
    }
  }
}