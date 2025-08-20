import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { EmailToSend } from '../entities/email-to-send.entity';
import { EmailTemplate } from '../entities/email-template.entity';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { EmailProcessResponseDto } from '../dto/email-process-response.dto';

//Sends and formats html templates based on the content-url
@Injectable()
export class MailTemplateService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {}

  returnManager() {
    return this.entityManager;
  }

  async getAndFormatTemplate(templateUrl, context): Promise<string> {
    let templateString;
    const contentUri = this.configService.get<string>('app.contentUri');
    try {
      const url = `${contentUri}/${templateUrl}`;
      const template = await firstValueFrom(this.httpService.get(url));
      templateString = template.data;
    } catch (e) {
      throw new EaseyException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Process loop syntax first: [[#arrayName]]...[[/arrayName]]
    templateString = this.processLoopSyntax(templateString, context);

    // Process regular variable substitution
    for (const key in context) {
      if (Object.prototype.hasOwnProperty.call(context, key)) {
        const regex = new RegExp(`\\[\\[${key}\\]\\]`, 'g');

        let formattedValue;

        if (typeof context[key] === 'object') {
          formattedValue = context[key].join(', ');
        } else {
          formattedValue = context[key] ?? '';
        }

        templateString = templateString.replace(regex, formattedValue);
      }
    }

    return templateString;
  }

  private processLoopSyntax(templateString: string, context: any): string {
    // Find loop patterns: [[#arrayName]]content[[/arrayName]]
    const loopPattern = /\[\[#(\w+)]]([\s\S]*?)\[\[\/\1]]/g;
    
    return templateString.replace(loopPattern, (match, arrayName, loopContent) => {
      const arrayData = context[arrayName];
      if (!arrayData || !Array.isArray(arrayData)) {
        return '';
      }
      
      // Process each item in the array
      const processedItems = arrayData.map(item => {
        if (!item || typeof item !== 'object') {
          return ''; // Skip invalid items
        }
        
        let processedContent = loopContent;
        // Replace variables within this loop iteration
        for (const key in item) {
          if (Object.prototype.hasOwnProperty.call(item, key)) {
            const regex = new RegExp(`\\[\\[${key}\\]\\]`, 'g');
            const value = item[key] ?? '';
            processedContent = processedContent.replace(regex, value);
          }
        }
        
        return processedContent;
      });
      
      return processedItems.join('');
    });
  }


  async sendTemplateEmail(
    to: string,
    from: string,
    subject: string,
    templateLocation: string,
    context: object,
  ) {
    const formattedTemplate = await this.getAndFormatTemplate(
      templateLocation,
      context,
    );
    this.mailerService
      .sendMail({
        from: from,
        to: to, // List of receivers email address
        subject: subject, // Subject line
        html: formattedTemplate, // HTML body content
      })
      .then((_success) => {
        this.logger.debug(`Successfully sent a template email`);
      })
      .catch((_err) => {
        this.logger.error(`Failed to sent a template email`);
      });
  }

  async sendEmailRecord(emailToSendId: number): Promise<EmailProcessResponseDto> {
    try {
      const record = await this.entityManager.findOneBy(EmailToSend, {
        toSendIdentifier: emailToSendId,
      });
      
      if (!record) {
        // Scenario 2: Record not found
        this.logger.error(`Email record not found for emailToSendId: ${emailToSendId}`);
        return { success: false, message: `Email record ${emailToSendId} not found` };
      }

      //Call into the template email service
      const template =
        record.templateIdentifier &&
        (await this.entityManager.findOneBy(EmailTemplate, {
          templateIdentifier: record.templateIdentifier,
        }));

      if (!template) {
        this.logger.error(`Template not found for templateId: ${record.templateIdentifier ?? 'null'}`);
        return { success: false, message: `Template ${record.templateIdentifier ?? 'null'} not found` };
      }

      let context; //Extract context
      if (record.context) {
        context = JSON.parse(record.context);
      } else {
        context = {};
      }

      await this.sendTemplateEmail(
        record.toEmail,
        record.fromEmail,
        template.templateSubject,
        template.templateLocation,
        context,
      );

      record.statusCode = 'COMPLETE';
      await this.entityManager.save(record);
      
      return { success: true };
    } catch (e) {
      this.logger.error(`Failed to process email ${emailToSendId}: ${e.message}`, e.stack);
      return { success: false, message: e.message };
    }
  }
}
