import { Injectable, HttpStatus, forwardRef, Inject } from '@nestjs/common';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { SubmissionSet } from '../entities/submission-set.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import { v4 as uuidv4 } from 'uuid';
import { SubmissionSetHelperService } from './submission-set-helper.service';
import { SubmissionEmailService } from './submission-email.service';
import { MailEvalService } from '../mail/mail-eval.service';
import { ConfigService } from '@nestjs/config';
import { ClientConfig } from '../entities/client-config.entity';

@Injectable()
export class ErrorHandlerService {
  constructor(
    private readonly logger: Logger,

    @Inject(forwardRef(() => SubmissionEmailService))
    private readonly submissionEmailService: SubmissionEmailService,
    private readonly mailEvalService: MailEvalService,
    private readonly submissionSetHelper: SubmissionSetHelperService,
    private readonly configService: ConfigService,
  ) {}

  async handleError(
    set: SubmissionSet,
    queueRecords: SubmissionQueue[],
    e: Error,
  ) {

    // JSON.stringify the error details
    try {
      // Safely capture error details
      set.details = JSON.stringify({
        message: e.message,
        stack: e.stack,
        name: e.name,
      });
    } catch (serializationError) {
      // Fallback in case serialization fails
      set.details = `Error serializing original error: ${serializationError.message}`;
    }

    // Update the submission set status to 'ERROR'
    try {
      await this.submissionSetHelper.updateSubmissionSetStatus(set, 'ERROR', set.details);
    } catch (updateError) {
      this.logger.error('Error during handleError for submission set, while updating submission set: ' + set?.submissionSetIdentifier, updateError.stack,);
    }

    try {
      // Attempt to update submission queue records
      await this.submissionSetHelper.setRecordStatusCode(set, queueRecords,'ERROR','Process failure, see set details','REQUIRE',);
    } catch (updateQueueError) {
      this.logger.error('Error during handleError for submission set, while updating submission queue:' + set?.submissionSetIdentifier, updateQueueError.stack,);
    }

    const errorId = uuidv4();
    this.logger.error(e.message, e.stack, 'submission', {statusCode: HttpStatus.INTERNAL_SERVER_ERROR,errorId: errorId,});

    // Send failure emails
    try {
      // Send failure emails
      await this.sendFailureEmails(set, e, errorId);
    } catch (emailError) {
      // If sending emails fails, log the error
      console.error('Failed to send failure emails for submission set: ' + set?.submissionSetIdentifier, emailError);
    }
  }

  private async sendFailureEmails(
    set: SubmissionSet,
    error: Error,
    errorId: string,
  ) {

    let fromEmail: string;
    let supportEmail: string;
    let ecmpsClientConfig: ClientConfig;

    try {
      fromEmail = this.configService.get<string>('app.defaultFromEmail') || 'noreply@epa.gov';
    } catch (configError) {
      fromEmail = 'noreply@epa.gov';
      this.logger.error('Failed to get default fromEmail. Using ' + fromEmail, configError.stack);
    }

    const toEmail = set?.userEmail || '';
    try {
      ecmpsClientConfig = await this.submissionEmailService.getECMPSClientConfig();
      supportEmail = ecmpsClientConfig?.supportEmail?.trim() || 'ecmps-support@camdsupport.com';
    } catch (configError) {
      supportEmail = 'ecmps-support@camdsupport.com';
      this.logger.error('Failed to get support email. Using: ' + supportEmail, configError.stack);
    }

    // Send email to user
    if (toEmail) {
      try {
        await this.mailEvalService.sendEmailWithRetry(
          toEmail,
          '', // No CC
          fromEmail,
          'Submission Processing Error',
          'submissionFailureUserTemplate', // Template name
          {
            configuration: set.configuration,
            submissionId: set.submissionSetIdentifier,
            errorId: errorId,
            supportEmail: supportEmail,
          },
          1,
        );
      } catch (userEmailError) {
        this.logger.error('Failed to submission processing failure email to user. Set: ' + set?.submissionSetIdentifier, userEmailError.stack);
      }
    } else {
      this.logger.warn('User email is not provided; skipping sending submission processing failure email to user.  Set: ' + set?.submissionSetIdentifier);
    }

    // Send email to ECMPS support
    try {
      await this.mailEvalService.sendEmailWithRetry(
        supportEmail,
        '', // No CC
        fromEmail,
        'Submission Processing Error - Support Notification',
        'submissionFailureSupportTemplate', // Template name
        {
          configuration: set.configuration,
          submissionId: set.submissionSetIdentifier,
          errorId: errorId,
          errorDetails: error.stack,
          userEmail: set.userEmail,
        },
        1,
      );
    } catch (supportEmailError) {
      this.logger.error('Failed to send submission processing failure email to support. Set: ' + set?.submissionSetIdentifier, supportEmailError.stack);
    }
  }
}
