import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { extname } from 'node:path';
import { Attachment } from 'nodemailer/lib/mailer';

import { NodemailerService } from './nodemailer/nodemailer.service';
import { EaseyContentTemplateService } from './easey-content-template.service';
import { EmailToSendService } from './email-to-send.service';
import { ClientConfigService } from './client-config.service';
import { TemplateEmailOptions, SendMailOptions } from './interfaces/mail-interfaces';
import { CreateMailDto } from '../dto/create-mail.dto';

@Injectable()
export class MailService {
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 1000;

  constructor(
    private readonly nodemailerService: NodemailerService,
    private readonly easeyContentTemplateService: EaseyContentTemplateService,
    private readonly emailToSendService: EmailToSendService,
    private readonly clientConfigService: ClientConfigService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  /**
   * Adds environment suffix to email subject for non-production environments
   * @param subject Original email subject
   * @returns Subject with environment suffix if applicable
   */
  private addEnvironmentSuffix(subject: string): string {
    const env = this.configService.get('app.env');
    const suffix = env && !['prod', 'production', ''].includes(env) ? ` (sent from ECMPS 2.0 ${env})` : '';
    return subject + suffix;
  }

  /**
   * Send email with template ID (fire-and-forget)
   * @param options EmailOptions with template ID
   */
  sendTemplateEmail(options: TemplateEmailOptions): void {
    this.sendWithRetry(async () => {
      const template = await this.easeyContentTemplateService.getTemplateById(options.templateId);
      
      // Always add email addresses to context for template replacement
      const context = { ...options.context };
      context.toEmail = options.to;
      context.fromEmail = options.from;
      
      const html = await this.easeyContentTemplateService.renderHandlebarsTemplate(
        template.templateLocation,
        context
      );

      await this.nodemailerService.sendMail({
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        from: options.from,
        subject: this.addEnvironmentSuffix(options.subject),
        html,
        attachments: options.attachments,
      });
    });
  }

  /**
   * Send plain text email (fire-and-forget)
   * @param options Send mail options
   */
  sendPlainEmail(options: SendMailOptions): void {
    this.sendWithRetry(async () => {
      await this.nodemailerService.sendMail({
        ...options,
        subject: this.addEnvironmentSuffix(options.subject),
      });
    });
  }

  /**
   * Send email with synchronous retry for those clients that require actual email sending status
   * @param options Email options
   * @returns Promise with success/failure details
   */
  async sendEmailWithSyncRetry(options: SendMailOptions): Promise<{ success: boolean; message?: string }> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.nodemailerService.sendMail({
          ...options,
          subject: this.addEnvironmentSuffix(options.subject),
        });
        this.logger.debug(`Email sent successfully on attempt ${attempt}`);
        return { success: true };
      } catch (error) {
        this.logger.warn(`Email attempt ${attempt} failed:`, error);
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelayMs * attempt));
        } else {
          this.logger.error(`Email failed after ${this.maxRetries} attempts:`, error);
          return { success: false, message: error.message };
        }
      }
    }
    return { success: false, message: 'Unexpected error' };
  }

  /**
   * Send contact us email (validates client config and sends fire-and-forget)
   * @param clientId Client ID to lookup support email
   * @param payload Email payload
   */
  async sendContactUsEmail(clientId: string, payload: CreateMailDto): Promise<void> {
    // Validate client config synchronously
    const clientConfig = await this.clientConfigService.getClientConfigById(clientId);

    // Fire-and-forget the actual email sending
    this.sendWithRetry(async () => {
      await this.nodemailerService.sendMail({
        from: payload.fromEmail,
        to: clientConfig.supportEmail,
        subject: this.addEnvironmentSuffix(payload.subject),
        text: payload.message,
      });
    });
  }

  /**
   * Load valid attachment records without blocking the parent email
   * @param emailToSendId Database EmailToSend record ID
   * @returns Valid Nodemailer attachments
   */
  private async getEmailAttachments(emailToSendId: number): Promise<Attachment[]> {
    let attachmentRecords: unknown;

    try {
      attachmentRecords = await this.emailToSendService.findEmailAttachments(emailToSendId);
    } catch (error) {
      this.logger.warn(
        `Unable to load EmailAttachment records for EmailToSend record ${emailToSendId}. Sending email without attachments.`,
        error,
      );
      return [];
    }

    if (!Array.isArray(attachmentRecords)) {
      this.logger.warn(
        `EmailAttachment lookup returned invalid data for EmailToSend record ${emailToSendId}. Sending email without attachments.`,
      );
      return [];
    }

    const attachments: Attachment[] = [];

    for (const attachmentRecordData of attachmentRecords) {
      if (!attachmentRecordData || typeof attachmentRecordData !== 'object') {
        this.logger.warn(
          `Skipping invalid EmailAttachment record for EmailToSend record ${emailToSendId}: record is missing or malformed.`,
        );
        continue;
      }

      const attachmentRecord = attachmentRecordData as Record<string, unknown>;
      const attachmentName = attachmentRecord.emailAttachmentName;
      const attachmentContent = attachmentRecord.emailAttachmentContent;
      const hasValidName =
        typeof attachmentName === 'string' && attachmentName.trim().length > 0;
      const hasValidContent =
        typeof attachmentContent === 'string' &&
        attachmentContent.trim().length > 0;
      const invalidFields: string[] = [];
      if (!hasValidName) {
        invalidFields.push('emailAttachmentName is missing or empty');
      }
      if (!hasValidContent) {
        invalidFields.push('emailAttachmentContent is missing or empty');
      }

      if (!hasValidName || !hasValidContent) {
        this.logger.warn(
          `Skipping invalid EmailAttachment record ${attachmentRecord.emailAttachmentIdentifier ?? 'unknown'} for EmailToSend record ${emailToSendId}: ${invalidFields.join(', ')}.`,
        );
        continue;
      }

      attachments.push({
        filename: attachmentName,
        content: attachmentContent,
      });
    }

    return attachments;
  }

  /**
   * Process EmailToSend record with synchronous error reporting
   * @param emailToSendId Database record ID from EmailToSend table
   * @returns Promise with success/failure details
   */
  async sendEmailToSendRecord(emailToSendId: number): Promise<{ success: boolean; message?: string }> {
    try {
      // Get and validate EmailToSend record
      const emailRecord = await this.emailToSendService.findEmailToSendRecord(emailToSendId);
      if (!emailRecord) {
        return { success: false, message: `EmailToSend record ${emailToSendId} not found` };
      }

      const attachments = await this.getEmailAttachments(emailToSendId);

      // Get template
      const template = await this.easeyContentTemplateService.getTemplateById(emailRecord.templateIdentifier);
      
      // Prepare context
      const context = emailRecord.context ? JSON.parse(emailRecord.context) : {};
      // Always add email addresses to context for template replacement
      // Works for both HTML [[toEmail]] and Handlebars {{toEmail}} placeholders
      context.toEmail = emailRecord.toEmail;
      context.fromEmail = emailRecord.fromEmail;
      
      const html = await (() => {
        const ext = extname(template.templateLocation).toLowerCase();
        if (ext === '.hbs') {
          // Use Handlebars template processing
          return this.easeyContentTemplateService.renderHandlebarsTemplate(
            template.templateLocation,
            context,
          );
        } else {
          // Use original custom template processing
          return this.easeyContentTemplateService.renderCustomTemplate(
            template.templateLocation,
            context
          );
        }
      })();

      // Send email using MailService with synchronous retry
      const result = await this.sendEmailWithSyncRetry({
        to: emailRecord.toEmail,
        from: emailRecord.fromEmail,
        subject: template.templateSubject,
        html,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (result.success) {
        // Update status in database after successful send
        await this.emailToSendService.markEmailToSendComplete(emailToSendId);
        return { success: true };
      } else {
        await this.emailToSendService.markEmailToSendFailed(emailToSendId, result.message || 'Unknown error');
        return { success: false, message: result.message };
      }

    } catch (error) {
      // Preparation errors (database, template issues)
      this.logger.error('Failed to process EmailToSend record:', error);
      const errorMessage = error.response?.data?.message || error.response?.data || error.message || `${error.name}: Status ${error.status}` || 'Unknown error';
      return { success: false, message: errorMessage };
    }
  }

  private sendWithRetry(emailFunction: () => Promise<void>): void {
    // Fire-and-forget with retry logic - runs in background
    setImmediate(async () => {
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          await emailFunction();
          this.logger.debug(`Email sent successfully on attempt ${attempt}`);
          return;
        } catch (error) {
          this.logger.warn(`Email attempt ${attempt} failed:`, error);
          if (attempt < this.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, this.retryDelayMs * attempt));
          } else {
            this.logger.error(`Email failed after ${this.maxRetries} attempts:`, error);
          }
        }
      }
    });
  }
}
