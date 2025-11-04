import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { EmailTemplate } from '../entities/email-template.entity';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import * as Handlebars from 'handlebars';
import { EMAIL_TEMPLATE_PARTIALS } from '../constants/email-template-ids';

@Injectable()
export class EaseyContentTemplateService {
  private handlebars = Handlebars.create();
  private partialsRegistered = false;

  constructor(
    private readonly entityManager: EntityManager,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {
    // Register custom helpers for the isolated handlebars instance
    this.registerHelpers();
  }

  private registerHelpers() {
    // Register the notEquals helper needed by templates
    this.handlebars.registerHelper('notEquals', function(a, b) {
      return a !== b;
    });

    // Register the eq helper
    this.handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });

    // Register the equals helper (alternative to eq)
    this.handlebars.registerHelper('equals', function(a, b) {
      return a === b;
    });

    // Register the not_eq helper (alternative to notEquals)
    this.handlebars.registerHelper('not_eq', function(a, b) {
      return a !== b;
    });

    // Register the and helper for logical AND operations
    this.handlebars.registerHelper('and', function() {
      return Array.prototype.every.call(arguments, Boolean);
    });

    // Register the or helper for logical OR operations
    this.handlebars.registerHelper('or', function() {
      return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    });

    // Register isObject helper to check if value is an object
    this.handlebars.registerHelper('isObject', function(value) {
      return typeof value === 'object' && value !== null;
    });
  }

  private async registerPartials() {
    // Register all configured partials
    for (const [templateType, config] of Object.entries(EMAIL_TEMPLATE_PARTIALS)) {
      this.logger.debug(`Registering partials for ${templateType}`);
      
      for (const partialName of config.partials) {
        try {
          const partialPath = `${config.basePath}/${partialName}.hbs`;
          const partialContent = await this.getTemplateContent(partialPath);
          this.handlebars.registerPartial(partialName, partialContent);
          this.logger.debug(`Registered partial: ${partialName}`);
        } catch (error) {
          this.logger.error(`Failed to register partial ${partialName} from ${config.basePath}`, error.message);
        }
      }
    }
  }

  returnManager() {
    return this.entityManager;
  }

  // Handlebars template methods
  async getTemplateContent(templateLocation: string): Promise<string> {
    const contentUri = this.configService.get<string>('app.contentUri');
    let url = '';
    try {
      // Handle trailing/leading slashes properly - ensure exactly one trailing slash
      const baseUrl = contentUri.endsWith('/') ? contentUri : `${contentUri}/`;
      url = new URL(templateLocation, baseUrl).toString();
      const template = await firstValueFrom(this.httpService.get(url));
      return template.data;
    } catch (e) {
      // Extract meaningful error information
      const errorMessage = e.response?.status
        ? `HTTP ${e.response.status}: ${e.response.statusText || 'Request failed'}`
        : e.message || 'Unknown error';

      this.logger.error(`Failed to fetch template from ${url}: ${errorMessage}`);
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
      // Ensure partials are registered before rendering (lazy loading)
      if (!this.partialsRegistered) {
        await this.registerPartials();
        this.partialsRegistered = true;
      }

      const templateString = await this.getTemplateContent(templateLocation);
      // Compile template (following TemplateService pattern with strict mode)
      const template = this.handlebars.compile(templateString, { strict: true });
      return template(context);
    } catch (error) {
      this.logger.error(`Failed to render Handlebars template ${templateLocation}`, error.message);
      throw error;
    }
  }

  //This is for rending simple custom template syntax that is currently using [[]] format.
  async renderCustomTemplate(templateUrl, context): Promise<string> {
    let templateString;
    const contentUri = this.configService.get<string>('app.contentUri');
    try {
      // Handle trailing/leading slashes properly
      const url = new URL(templateUrl, contentUri.replace(/\/?$/, '/')).toString();
      const template = await firstValueFrom(this.httpService.get(url));
      templateString = template.data;
    } catch (e) {
      // Extract meaningful error information
      const errorMessage = e.response?.status
        ? `HTTP ${e.response.status}: ${e.response.statusText || 'Request failed'}`
        : e.message || 'Unknown error';

      this.logger.error(`Failed to fetch template from ${templateUrl}: ${errorMessage}`);
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
