import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SentMessageInfo } from 'nodemailer';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { ConfigService } from '@nestjs/config';
import { SendMailOptions } from '../interfaces/mail-interfaces';
import { smtpHost, smtpPort } from '../../config/app.config';
import * as fs from 'fs/promises';

@Injectable()
export class NodemailerService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  async onModuleInit() {
    this.createTransporter();
    // Verify connection in background - don't block startup
    this.verifyConnectionInBackground();
  }

  private createTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
    });

    this.logger.debug(`Nodemailer transporter created for ${smtpHost}:${smtpPort}`);
  }

  private verifyConnectionInBackground(): void {
    // Run verification in background without blocking startup
    setImmediate(async () => {
      try {
        await this.transporter.verify();
        this.logger.debug('Nodemailer connection verified successfully');
      } catch (error) {
        this.logger.error('Failed to verify nodemailer connection', error);
        // Don't throw - allow service to start even if mail server is temporarily unavailable
      }
    });
  }

  async sendMail(mailOptions: SendMailOptions): Promise<SentMessageInfo> {
    try {
      // Check if we should use preview mode for local development testing
      const enableLocalEmailPreview = this.configService.get<boolean>('app.enableLocalEmailPreview');
      const environment = this.configService.get('app.env');
      
      if (enableLocalEmailPreview && environment !== 'production' && environment !== 'prod') {
        return await this.previewEmail(mailOptions);
      }

      // Handle comma-separated recipients by sending individual emails
      const recipients = this.splitRecipients(mailOptions.to);
      
      if (recipients.length <= 1) {
        // Single or no recipient - send normally
        const result = await this.transporter.sendMail(mailOptions);
        this.logger.debug(`Email sent successfully to ${mailOptions.to}`);
        return result;
      }
      
      // Multiple recipients - send individual emails
      let successCount = 0;
      const successful: string[] = [];
      const failed: string[] = [];
      
      for (const recipient of recipients) {
        try {
          await this.transporter.sendMail({ ...mailOptions, to: recipient });
          successful.push(recipient);
          successCount++;
        } catch (error) {
          failed.push(recipient);
          this.logger.error(`Failed to send email to ${recipient}`, error);
        }
      }
      
      // If all failed, throw error
      if (successCount === 0) {
        throw new Error(`Failed to send emails to all ${recipients.length} recipients`);
      }
      
      this.logger.debug(`Sent ${successCount}/${recipients.length} emails successfully`);
      return {
        accepted: successful,
        rejected: failed,
        response: `Sent individual emails to ${successCount}/${recipients.length} recipients`
      } as SentMessageInfo;
    } catch (error) {
      this.logger.error(`Failed to send email to ${mailOptions.to}`, error);
      throw error;
    }
  }

  private async previewEmail(mailOptions: SendMailOptions): Promise<SentMessageInfo> {
    try {
      // Dynamic import to avoid loading preview-email in production
      const previewEmailModule = await import('preview-email');
      const previewEmail = previewEmailModule.default || previewEmailModule;

      const previewDir = this.configService.get('app.localEmailPreviewDirectory');
      
      if (!previewDir) {
        this.logger.error('EASEY_CAMD_SERVICES_LOCAL_EMAIL_PREVIEW_DIRECTORY not configured - cannot preview email');
        throw new Error('Email preview directory not configured');
      }
      
      // Ensure the preview directory exists
      await fs.mkdir(previewDir, { recursive: true });
      
      const previewOptions = {
        dir: previewDir,
        open: this.configService.get<boolean>('app.localEmailPreviewOpen') ?? false,
        openSimulator: false,
      };

      const previewUrl = await previewEmail(mailOptions, previewOptions);
      
      this.logger.debug(`Email previewed at: ${previewUrl}`);
      this.logger.debug(`Preview saved to: ${previewOptions.dir}`);

      // Return a mock successful result for consistency
      return {
        messageId: `preview-${Date.now()}@local`,
        accepted: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
        rejected: [],
        pending: [],
        response: `Email previewed at ${previewUrl}`,
      } as SentMessageInfo;
    } catch (error) {
      this.logger.error('Failed to preview email', error);
      throw error;
    }
  }

  private splitRecipients(to: string | string[] | undefined | null): string[] {
    if (!to) return [];
    
    if (Array.isArray(to)) {
      return to.flatMap(recipient =>
        recipient ? this.splitBySeparators(recipient) : []
      );
    }

    return this.splitBySeparators(to);
  }

  private splitBySeparators(emailString: string): string[] {
    // Split by both commas and semicolons, trim whitespace, and filter out empty strings
    return emailString
      .split(/[,;]/)
      .map(email => email.trim())
      .filter(email => email);
  }

  getTransporter(): nodemailer.Transporter {
    return this.transporter;
  }
}