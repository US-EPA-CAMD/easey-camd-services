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
import { SubmissionFeedbackRecordService } from './submission-feedback-record.service';
import { Plant } from '../entities/plant.entity';

@Injectable()
export class ErrorHandlerService {
  constructor(
    private readonly logger: Logger,

    @Inject(forwardRef(() => SubmissionEmailService))
    private readonly submissionEmailService: SubmissionEmailService,

    private readonly mailEvalService: MailEvalService,
    private readonly submissionSetHelper: SubmissionSetHelperService,
    private readonly configService: ConfigService,
    private readonly submissionFeedbackRecordService: SubmissionFeedbackRecordService,
  ) {}

  async handleQueueingError(
    submissionSet: SubmissionSet,
    currentSubmissionQueue: SubmissionQueue,
    userEmail: string,
    userId: string,
    rootError: Error,
  ) {
    try {
      // Generate an error ID
      const errorId = uuidv4();

      // Log the error
      this.logger.error(`Queueing Error for UserId: ${userId || 'Unknown'}`, rootError?.stack || '', 'Submission Queue', { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, errorId });

      // Get support email
      let supportEmail: string;
      let ecmpsClientConfig: ClientConfig;
      try {
        ecmpsClientConfig = await this.submissionEmailService.getECMPSClientConfig();
        supportEmail = ecmpsClientConfig?.supportEmail?.trim?.() || 'ecmps-support@camdsupport.com';
      } catch (configError) {
        supportEmail = 'ecmps-support@camdsupport.com';
        this.logger.error('Failed to get support email. Using: ' + supportEmail, configError.stack);
      }

      // Get CDX Url this.configService.get<string>('app.cdxUrl')
      let cdxUrl: string;
      try {
        cdxUrl = this.configService.get<string>('app.cdxUrl') || 'https://cdx.epa.gov/';
      } catch (configError) {
        cdxUrl = 'https://cdx.epa.gov/';
        this.logger.error('Failed to get CDX URL. Using ' + cdxUrl, configError?.stack);
      }

      // Retrieve the facility information to get the State (it is not on the Submission Set)
      let facility: Plant;
      try {
        facility = submissionSet && submissionSet.facIdentifier
          ? await this.submissionSetHelper.getFacilityByFacIdentifier(submissionSet.facIdentifier)
          : null;
      } catch (facilityError) {
        this.logger.error('Failed to get facility information.', facilityError.stack);
        facility = null;
      }

      // Get submission type
      let submissionType: string = 'N/A';
      try {
        submissionType = await this.submissionEmailService.getSubmissionType(currentSubmissionQueue?.processCode) || 'N/A';
      } catch (submissionTypeError) {
        this.logger.error('Failed to get submission type.', submissionTypeError.stack);
      }

      // Get submission date display
      let submissionDateDisplay: string = new Date().toLocaleString();
      try {
        submissionDateDisplay = await this.submissionFeedbackRecordService.getDisplayDate(submissionSet?.submittedOn || new Date());
      } catch (dateDisplayError) {
        this.logger.error('Failed to get submission date display.', dateDisplayError.stack);
      }

      // Prepare email context
      const emailTemplateContext = {
        submissionType: submissionType,
        facilityName: submissionSet?.facName || 'N/A',
        stateCode: facility?.state || 'N/A',
        orisCode: submissionSet?.orisCode || 'N/A',
        configuration: submissionSet?.configuration || 'N/A',
        submissionDateDisplay: submissionDateDisplay,
        submitter: userEmail,
        errorId: errorId,
        errorDetails: rootError.message,
        supportEmail: supportEmail,
        toEmail: userEmail,
        ccEmail: supportEmail,
        cdxUrl: cdxUrl,
      };

      // Email subject
      const processCode = currentSubmissionQueue?.processCode || 'N/A';
      const emailSubject = `${processCode} Feedback for ORIS code ${emailTemplateContext.orisCode} Unit ${emailTemplateContext.configuration}`;

      // Send failure emails
      await this.sendEmail(
        emailTemplateContext,
        userEmail,
        supportEmail,
        emailSubject,
        'queueingFailureUserTemplate',
      );
    } catch (emailError) {
      this.logger.error('Failed to send queueing failure email.', emailError.stack);
    }
  }

  async handleSubmissionProcessingError(
    set: SubmissionSet,
    queueRecords: SubmissionQueue[],
    rootError: Error,
  ) {

    // JSON.stringify the error details
    try {
      // Safely capture error details
      set.details = JSON.stringify({
        message: rootError.message,
        stack: rootError.stack,
        name: rootError.name,
      });
    } catch (serializationError) {
      // Fallback in case serialization fails
      set.details = `Error serializing original error: ${serializationError.message}`;
    }

    // Update the submission set status to 'ERROR'
    try {
      await this.submissionSetHelper.updateSubmissionSetStatus(set, 'ERROR', set.details);
    } catch (updateError) {
      this.logger.error('Error during handleSubmissionProcessingError for submission set, while updating submission set: ' + set?.submissionSetIdentifier, updateError.stack,);
    }

    try {
      // Attempt to update submission queue records
      await this.submissionSetHelper.setRecordStatusCode(set, queueRecords,'ERROR','Process failure, see set details','REQUIRE',);
    } catch (updateQueueError) {
      this.logger.error('Error during handleSubmissionProcessingError for submission set, while updating submission queue:' + set?.submissionSetIdentifier, updateQueueError.stack,);
    }

    //Get the userEmail
    const userEmail = set?.userEmail || '';

    //Get the support Email
    let supportEmail: string;
    let ecmpsClientConfig: ClientConfig;
    try {
      ecmpsClientConfig = await this.submissionEmailService.getECMPSClientConfig();
      supportEmail = ecmpsClientConfig?.supportEmail?.trim() || 'ecmps-support@camdsupport.com';
    } catch (configError) {
      supportEmail = 'ecmps-support@camdsupport.com';
      this.logger.error('Failed to get support email. Using: ' + supportEmail, configError.stack);
    }

    const errorId = uuidv4();
    this.logger.error(rootError.message, rootError.stack, 'submission', {statusCode: HttpStatus.INTERNAL_SERVER_ERROR,errorId: errorId,});

    const emailSubject = 'Submission Processing Error';

    // Send failure emails
    try {
      // Send failure emails
      const emailTemplateContext = {
        configuration: set.configuration,
        submissionId: set.submissionSetIdentifier,
        errorId: errorId,
        errorDetails: rootError.stack,
      }
      await this.sendEmail(emailTemplateContext, userEmail, supportEmail, emailSubject, 'submissionFailureUserTemplate');
      await this.sendEmail(emailTemplateContext, supportEmail, supportEmail, emailSubject, 'submissionFailureSupportTemplate');
    } catch (emailError) {
      // If sending emails fails, log the error
      console.error('Failed to send failure emails for submission set: ' + set?.submissionSetIdentifier, emailError);
    }
  }

  private async sendEmail(
    emailTemplateContext: any, // Add this parameter
    toEmail: string,
    ccEmail: string,
    subject: string,
    template: string,
  ) {

    let fromEmail: string;

    try {
      fromEmail = this.configService.get<string>('app.defaultFromEmail') || 'noreply@epa.gov';
    } catch (configError) {
      fromEmail = 'noreply@epa.gov';
      this.logger.error('Failed to get default fromEmail. Using ' + fromEmail, configError.stack);
    }

    // Send email to user
    if (toEmail) {
      try {
        await this.mailEvalService.sendEmailWithRetry(
          toEmail,
          ccEmail || '',
          fromEmail,
          subject,
          template, // Template name
          emailTemplateContext,
          1,
        );
      } catch (userEmailError) {
        this.logger.error('Failed to send failure email to ' + toEmail, userEmailError?.stack);
      }
    } else {
      this.logger.warn('Destination email is not provided; skipping processing failure email to user.');
    }
  }
}
