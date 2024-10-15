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
import { SeverityCode } from '../entities/severity-code.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class ErrorHandlerService {
  constructor(
    private readonly logger: Logger,

    @Inject(forwardRef(() => SubmissionEmailService))
    private readonly submissionEmailService: SubmissionEmailService,
    private readonly entityManager: EntityManager,
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
    submissionSet: SubmissionSet,
    queueRecords: SubmissionQueue[],
    rootError: Error,
  ) {

    try {

      // JSON.stringify the error details
      try {
        // Safely capture error details
        submissionSet.details = JSON.stringify({
          message: rootError?.message || 'No message',
          stack: rootError?.stack || 'No stack trace available',
          name: rootError?.name || 'UnknownError',
        });
      } catch (serializationError) {
        // Fallback in case serialization fails
        submissionSet.details = `Error serializing original error: ${serializationError.message}`;
      }

      // Update the submission submissionSet status to 'ERROR'
      try {
        await this.submissionSetHelper.updateSubmissionSetStatus(submissionSet, 'ERROR', submissionSet.details);
      } catch (updateError) {
        this.logger.error('Error during handleSubmissionProcessingError for submission submissionSet, while updating submission submissionSet: ' + submissionSet?.submissionSetIdentifier, updateError.stack,);
      }

      try {
        // Attempt to update submission queue records
        await this.submissionSetHelper.setRecordStatusCode(submissionSet, queueRecords, 'ERROR', 'Process failure, see submissionSet details', 'REQUIRE',);
      } catch (updateQueueError) {
        this.logger.error('Error during handleSubmissionProcessingError for submission submissionSet, while updating submission queue:' + submissionSet?.submissionSetIdentifier, updateQueueError.stack,);
      }

      //Get the userEmail
      const userEmail = submissionSet?.userEmail || '';

      //Get the support Email
      let supportEmail: string;
      let ecmpsClientConfig: ClientConfig;
      try {
        ecmpsClientConfig = await this.submissionEmailService.getECMPSClientConfig();
        supportEmail = ecmpsClientConfig?.supportEmail?.trim?.() || 'ecmps-support@camdsupport.com';
      } catch (configError) {
        supportEmail = 'ecmps-support@camdsupport.com';
        this.logger.error('Failed to get support email. Using: ' + supportEmail, configError?.stack || '');
      }

      const errorId = uuidv4();
      this.logger.error(rootError?.message, rootError?.stack, 'submission', {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorId: errorId,
      });

      // Get CDX Url this.configService.get<string>('app.cdxUrl')
      let cdxUrl: string;
      try {
        cdxUrl = this.configService.get<string>('app.cdxUrl') || 'https://cdx.epa.gov/';
      } catch (configError) {
        cdxUrl = 'https://cdx.epa.gov/';
        this.logger.error('Failed to get CDX URL. Using ' + cdxUrl, configError?.stack || '');
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

      //Get a submission queue to get the process code. We will use the one with the highest severity code
      let selectedSubmissionQueue: SubmissionQueue = null;
      try {
        const severityCodes: SeverityCode[] = await this.entityManager.find(SeverityCode);
        const highestSeverityRecord =
          await this.submissionEmailService.findRecordWithHighestSeverityLevel(
            queueRecords,
            severityCodes,
          );
        selectedSubmissionQueue = highestSeverityRecord?.submissionQueue;
      } catch (dateDisplayError) {
        selectedSubmissionQueue = queueRecords?.find(record => record != null) || null;
        this.logger.error('Failed to get submission queue.', dateDisplayError?.stack || '');
      }

      // Get submission type
      let submissionType: string = 'N/A';
      try {
        submissionType = (await this.submissionEmailService.getSubmissionType(selectedSubmissionQueue?.processCode)) || 'N/A';
      } catch (submissionTypeError) {
        this.logger.error('Failed to get submission type.', submissionTypeError?.stack || '');
      }

      // Get submission date display
      let submissionDateDisplay: string = new Date().toLocaleString();
      try {
        submissionDateDisplay = await this.submissionFeedbackRecordService.getDisplayDate(submissionSet?.submittedOn || new Date());
      } catch (dateDisplayError) {
        this.logger.error('Failed to get submission date display.', dateDisplayError?.stack || '');
      }

      // Prepare email context
      const emailTemplateContextForUser = {
        submissionType: submissionType,
        facilityName: submissionSet?.facName || 'N/A',
        stateCode: facility?.state || 'N/A',
        orisCode: submissionSet?.orisCode || 'N/A',
        configuration: submissionSet?.configuration || 'N/A',
        submissionDateDisplay: submissionDateDisplay,
        submitter: userEmail,
        supportEmail: supportEmail,
        toEmail: userEmail,
        ccEmail: supportEmail,
        cdxUrl: cdxUrl,
      };

      // Email subject
      const processCode = selectedSubmissionQueue?.processCode || 'N/A';
      const emailSubject = `${processCode} Feedback for ORIS code ${emailTemplateContextForUser.orisCode} Unit ${emailTemplateContextForUser.configuration}`;

      //Send one email to the user
      await this.sendEmail(emailTemplateContextForUser, userEmail, '', emailSubject, 'submissionFailureUserTemplate');

      //Prepare the email to support
      const submissionSetIdentifier = submissionSet.submissionSetIdentifier;

      // Extract submissionIdentifier values from queueRecords
      const submissionQueueIdentifiers = queueRecords
        .map(record => record.submissionIdentifier)
        .join(', ');

      // Get the units
      const units = emailTemplateContextForUser.configuration;

      // Construct the argument values
      const argumentValues = `Submission set: ${submissionSetIdentifier}, Submission Queues: ${submissionQueueIdentifiers}, Units: ${units}`;


      const emailTemplateContextForSupport = {
        ...emailTemplateContextForUser,
        submissionId: submissionSet?.submissionSetIdentifier || 'N/A',
        submitter: submissionSet?.userIdentifier || userEmail || 'N/A',
        errorId: errorId || 'N/A',
        errorMessage: rootError?.message,
        errorDetails: rootError?.stack || 'No error details available',
        argumentValues: argumentValues,
        errorDate: new Date().toLocaleString() || 'N/A',
      };

      //Send another email to Support with error details.
      await this.sendEmail(emailTemplateContextForSupport, supportEmail, '', emailSubject, 'submissionFailureSupportTemplate');

    }catch (error) {
      this.logger.error('Failed to handle submission processing error.', error?.stack || '');
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
