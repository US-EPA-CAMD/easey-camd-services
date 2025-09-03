import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import * as fs from 'fs/promises';

jest.mock('fs/promises');
jest.mock('@css-inline/css-inline', () => ({
  inline: jest.fn((html) => html), // Mock inline function to return HTML unchanged
}));

describe('TemplateService', () => {
  let service: TemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [TemplateService],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('renderTemplateFromString', () => {
    it('should render template with context', async () => {
      const templateString = '<h1>Hello {{name}}!</h1>';
      const context = { name: 'World' };

      const result = await service.renderTemplateFromString(templateString, context);

      expect(result).toBe('<h1>Hello World!</h1>');
    });

    it('should render template with equals helper', async () => {
      const templateString = '{{#if (equals status "active")}}Active{{/if}}';
      const context = { status: 'active' };

      const result = await service.renderTemplateFromString(templateString, context);

      expect(result).toBe('Active');
    });

    it('should render template with notEquals helper', async () => {
      const templateString = '{{#if (notEquals status "inactive")}}Not Inactive{{/if}}';
      const context = { status: 'active' };

      const result = await service.renderTemplateFromString(templateString, context);

      expect(result).toBe('Not Inactive');
    });
  });

  describe('renderTemplateByName', () => {
    it('should render template by name', async () => {
      const mockFileContent = '<h1>Hello {{name}}!</h1>';
      const mockReadFile = jest.mocked(fs.readFile);
      mockReadFile.mockResolvedValue(mockFileContent);

      const context = { name: 'Test' };
      const result = await service.renderTemplateByName('test', context);

      expect(result).toBe('<h1>Hello Test!</h1>');
      expect(mockReadFile).toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should clear template cache', () => {
      service.clearCache();
      // This is mainly for coverage, we can't easily test the internal cache clearing
    });
  });
});