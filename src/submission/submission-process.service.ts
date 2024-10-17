import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { SubmissionSet } from '../entities/submission-set.entity';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import { DocumentService } from './document.service';
import { SubmissionTransactionService } from './submission-transaction.service';
import { ErrorHandlerService } from './error-handler.service';
import { v4 as uuidv4 } from 'uuid';
import { mkdirSync } from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import { SubmissionSetHelperService } from './submission-set-helper.service';
import { SubmissionEmailService } from './submission-email.service';
import { MailEvalService } from '../mail/mail-eval.service';

@Injectable()
export class SubmissionProcessService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly logger: Logger,
    private readonly mailEvalService: MailEvalService,
    private readonly documentService: DocumentService,
    private readonly transactionService: SubmissionTransactionService,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly submissionEmailService: SubmissionEmailService,
    private readonly submissionSetHelper: SubmissionSetHelperService, // Injected helper
  ) {}

  async processSubmissionSet(id: string): Promise<void> {
    this.logger.log(`Processing submission set: ${id}`);

    let set: SubmissionSet;
    let submissionQueueRecords: SubmissionQueue[];
    let folderPath: string;

    try {
      set = await this.entityManager.findOne(SubmissionSet, { where: { submissionSetIdentifier: id }, });
      if (!set) {
        throw new Error(`SubmissionSet with id ${id} not found.`);
      }

      // Update the submission set and submission queue statuses to 'WIP'
      await this.submissionSetHelper.updateSubmissionSetStatus(set, 'WIP');
      submissionQueueRecords = await this.entityManager.find(SubmissionQueue, { where: { submissionSetIdentifier: id },});
      await this.submissionSetHelper.setRecordStatusCode(set, submissionQueueRecords, 'WIP', '', 'PENDING');
      this.logger.log(`Updating submission records to IP status.`);

      folderPath = path.join(__dirname, uuidv4());
      mkdirSync(folderPath);

      // Build transactions
      const transactions: any = [];
      await this.transactionService.buildTransactions(set, submissionQueueRecords, folderPath, transactions);
      this.logger.log(`Completed building transactions...`);

      // Build documents
      const documents = await this.documentService.buildDocumentsAndWriteToFile(set, submissionQueueRecords, folderPath);
      this.logger.log(`Completed building documents, successfully written to local file system...`);

      // Send documents for signing
      this.logger.log(`Sending for signing ... `);
      await this.documentService.sendForSigning(set, folderPath);

      // Get feedback email data before the call to copyToOfficial, which deletes data from workspace
      this.logger.log(`Collecting data for sending feedback reports...`);
      const submissionFeedbackEmailDataList = await this.submissionEmailService.collectFeedbackReportDataForEmail(set, submissionQueueRecords);

      // Copy records from workspace to official
      await this.copyToOfficial(set, submissionQueueRecords);

      // Send all feedback status emails once the copy/delete transaction is over
      this.logger.debug('Sending emails with feedback attachment ...');
      for (const submissionFeedbackEmailData of submissionFeedbackEmailDataList) {
          this.logger.debug('Sending email feedback...', {
            toEmail: submissionFeedbackEmailData.toEmail,
            ccEmail: submissionFeedbackEmailData.ccEmail,
            subject: submissionFeedbackEmailData.subject,
          });

          await this.mailEvalService.sendEmailWithRetry(
            submissionFeedbackEmailData.toEmail,
            submissionFeedbackEmailData.ccEmail,
            submissionFeedbackEmailData.fromEmail,
            submissionFeedbackEmailData.subject,
            submissionFeedbackEmailData.emailTemplate,
            submissionFeedbackEmailData.templateContext,
            1,
            submissionFeedbackEmailData.feedbackAttachmentDocuments,
          );
      }

      // Update the submission set and submission queue statuses to 'COMPLETE'
      await this.submissionSetHelper.setRecordStatusCode(set, submissionQueueRecords, 'COMPLETE', '', set.hasCritErrors ? 'CRITERR' : 'UPDATED');
      await this.submissionSetHelper.updateSubmissionSetStatus(set, 'COMPLETE');

    } catch (e) {
      this.logger.error('Error while processing submission set: ' + set?.submissionSetIdentifier, e.stack, 'SubmissionProcessService');
      await this.errorHandlerService.handleSubmissionProcessingError(set, submissionQueueRecords, e);
    } finally {
      await this.cleanup(folderPath);
    }
  }

  public async copyToOfficial(
    set: SubmissionSet,
    transactions: any[],
  ) {
    try {

      if (!set.hasCritErrors) {
        await this.entityManager.transaction(async (manager) => {
          for (const trans of transactions) {
            await manager.query(trans.command, trans.params);
          }
        });
      }
    } catch (e) {
      this.logger.error('Error during copyToOfficial processing.', e.stack, 'SubmissionProcessService');
      throw e; //Rethrow so that error handling takes over
    }

    this.logger.log('Finished copyToOfficial...');
  }

  private async cleanup(folderPath: string): Promise<void> {
    try {
      if (folderPath && folderPath.trim() !== '') {
        await fsPromises.rm(folderPath, { recursive: true, maxRetries: 5, retryDelay: 1, force: true });
      }
    } catch (e) {
      this.logger.error(`Error during cleanup. Error removing folderPath: ${folderPath}`, e.stack, 'SubmissionProcessService');
    }
  }
}
