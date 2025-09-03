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
    await this.verifyConnection();
  }

  private createTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
    });

    this.logger.debug(`Nodemailer transporter created for ${smtpHost}:${smtpPort}`);
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.debug('Nodemailer connection verified successfully');
    } catch (error) {
      this.logger.error('Failed to verify nodemailer connection', error);
      // Don't throw - allow service to start even if mail server is temporarily unavailable
    }
  }

  async sendMail(mailOptions: SendMailOptions): Promise<SentMessageInfo> {
    try {
      // Check if we should use preview mode for local development testing
      const enableLocalEmailPreview = this.configService.get<boolean>('app.enableLocalEmailPreview');
      const environment = this.configService.get('app.env');
      
      if (enableLocalEmailPreview && environment !== 'production' && environment !== 'prod') {
        return await this.previewEmail(mailOptions);
      }

      // Normal email sending
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.debug(`Email sent successfully to ${mailOptions.to}`);
      return result;
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

  getTransporter(): nodemailer.Transporter {
    return this.transporter;
  }
}