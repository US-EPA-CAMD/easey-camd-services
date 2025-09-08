import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { EmailTemplate } from '../entities/email-template.entity';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import * as Handlebars from 'handlebars';

@Injectable()
export class EaseyContentTemplateService {
  private handlebars = Handlebars.create();

  constructor(
    private readonly entityManager: EntityManager,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {}

  returnManager() {
    return this.entityManager;
  }

  // Handlebars template methods
  async getTemplateContent(templateLocation: string): Promise<string> {
    const contentUri = this.configService.get<string>('app.contentUri');
    try {
      const url = `${contentUri}/${templateLocation}`;
      const template = await firstValueFrom(this.httpService.get(url));
      return template.data;
    } catch (e) {
      this.logger.error(`Failed to fetch template: ${templateLocation}`, e);
      throw new EaseyException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getTemplateById(templateId: number): Promise<EmailTemplate> {
    const template = await this.entityManager.findOneBy(EmailTemplate, {
      templateIdentifier: templateId,
    });
    if (!template) {
      throw new EaseyException(
        new Error(`Template with ID ${templateId} not found`),
        HttpStatus.NOT_FOUND,
      );
    }
    return template;
  }

  //This is for rending standard handlebars syntax
  async renderHandlebarsTemplate(templateLocation: string, context: any): Promise<string> {
    try {
      const templateString = await this.getTemplateContent(templateLocation);
      // Compile template (following TemplateService pattern with strict mode)
      const template = this.handlebars.compile(templateString, { strict: true });
      return template(context);
    } catch (error) {
      this.logger.error(`Failed to render Handlebars template ${templateLocation}`, error);
      throw error;
    }
  }

  //This is for rending simple custom template syntax that is currently using [[]] format.
  async renderCustomTemplate(templateUrl, context): Promise<string> {
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
    templateString = this.processCustomLoopSyntax(templateString, context);

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

  private processCustomLoopSyntax(templateString: string, context: any): string {
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


}
