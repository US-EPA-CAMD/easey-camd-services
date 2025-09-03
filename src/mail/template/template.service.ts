import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { inline } from '@css-inline/css-inline';

@Injectable()
export class TemplateService {
  private readonly compiledTemplates = new Map<string, Handlebars.TemplateDelegate>();
  private handlebarsInstance: typeof Handlebars;
  private templateDir: string;

  constructor(private readonly logger: Logger) {
    this.templateDir = path.join(__dirname, '../templates'); // Default to mail/templates
    this.initializeHandlebars();
  }

  private initializeHandlebars(): void {
    this.handlebarsInstance = Handlebars.create();
    
    // Register custom helpers
    this.handlebarsInstance.registerHelper('equals', (a: any, b: any) => {
      return a === b;
    });
    
    this.handlebarsInstance.registerHelper('notEquals', (a: any, b: any) => {
      return a !== b;
    });
  }

  async renderTemplateByName(templateName: string, context: any): Promise<string> {
    try {
      const templatePath = path.join(this.templateDir, `${templateName}.hbs`);
      const template = await this.getCompiledTemplate(templatePath);
      const html = template(context);
      return this.inlineCSS(html);
    } catch (error) {
      this.logger.error(`Failed to render template ${templateName}`, error);
      throw error;
    }
  }

  async renderTemplateFromString(templateContent: string, context: any): Promise<string> {
    try {
      const template = this.handlebarsInstance.compile(templateContent, { strict: true });
      const html = template(context);
      return this.inlineCSS(html);
    } catch (error) {
      this.logger.error('Failed to render template from string', error);
      throw error;
    }
  }

  private async getCompiledTemplate(templatePath: string): Promise<Handlebars.TemplateDelegate> {
    if (!this.compiledTemplates.has(templatePath)) {
      const templateContent = await this.loadTemplate(templatePath);
      const compiled = this.handlebarsInstance.compile(templateContent, { strict: true });
      this.compiledTemplates.set(templatePath, compiled);
    }
    return this.compiledTemplates.get(templatePath)!;
  }

  private async loadTemplate(templatePath: string): Promise<string> {
    try {
      const fullPath = path.resolve(templatePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return content;
    } catch (error) {
      this.logger.error(`Failed to load template from ${templatePath}`, error);
      throw error;
    }
  }

  private inlineCSS(html: string): string {
    try {
      // CSS inlining for email templates
      // Keep at-rules (@media queries) for responsive emails
      return inline(html, {
        keepAtRules: true,
      });
    } catch (error) {
      this.logger.error('Failed to inline CSS', error);
      // Return original HTML if CSS inlining fails to avoid breaking email sending
      this.logger.warn('Returning original HTML without CSS inlining due to error');
      return html;
    }
  }

  clearCache(): void {
    this.compiledTemplates.clear();
    this.logger.debug('Template cache cleared');
  }
}