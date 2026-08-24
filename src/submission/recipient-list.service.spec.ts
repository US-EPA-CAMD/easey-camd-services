import { Test, TestingModule } from '@nestjs/testing';
import { RecipientListService } from './recipient-list.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { EntityManager } from 'typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { of } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { EmailRecipientListRequestDto } from '../dto/email-recipient-list-request.dto';
import { ClientTokenService } from '../client-token/client-token.service';

describe('RecipientListService', () => {
  let service: RecipientListService;
  let httpService: HttpService;
  let configService: ConfigService;
  let logger: Logger;
  let clientTokenService: ClientTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipientListService,
        {
          provide: ClientTokenService,
          useValue: {
            getClientToken: jest.fn().mockResolvedValue('mockToken'),
            buildAuthHeaders: jest.fn().mockReturnValue({}),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'app.recipientsListApi') {
                return 'http://mock-recipients-list-api.com';
              } else if (key === 'app.apiKey') {
                return 'mockApiKey';
              } else if (key === 'app.clientId') {
                return 'mockClientId';
              } else if (key === 'app.authApi.uri') {
                return 'http://mock-auth-api.com';
              } else if (key === 'app.clientSecret') {
                return 'mockClientSecret';
              }
              return null;
            }),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            request: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {},
        },
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecipientListService>(RecipientListService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    logger = module.get<Logger>(Logger);
    clientTokenService = module.get<ClientTokenService>(ClientTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('returnManager', () => {
    it('should return the entity manager', () => {
      const entityManager = service.returnManager();
      expect(entityManager).toBeDefined();
    });
  });

  describe('getEmailRecipients', () => {
    it('should return a list of email recipients', async () => {
      const mockRecipients = [
        { emailAddressList: 'email1@example.com' },
        { emailAddressList: 'email2@example.com' },
      ];
      const mockResponse: AxiosResponse<typeof mockRecipients> = {
        data: mockRecipients,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { method: 'GET', headers: {} as AxiosHeaders },
      };

      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(of(mockResponse) as any);
      jest.spyOn(clientTokenService, 'getClientToken').mockResolvedValue('mockToken');

      const result = await service.getEmailRecipients('', '', false, '', '');
      expect(result).toEqual('email1@example.com,email2@example.com');
    });

    it('should return an empty string if client token is not obtained', async () => {
      jest.spyOn(clientTokenService, 'getClientToken').mockResolvedValue('');

      const result = await service.getEmailRecipients('', '', false, '', '');
      expect(result).toEqual('');
      expect(logger.error).toHaveBeenCalledWith(
        'Unable to obtain client token from auth-api. Cannot proceed with emailRecipients API call',
      );
    });

    it('should return an empty string if API response format is invalid', async () => {
      const mockResponse: AxiosResponse<{}> = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { method: 'GET', headers: {} as AxiosHeaders },
      };

      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(of(mockResponse) as any);
      jest.spyOn(clientTokenService, 'getClientToken').mockResolvedValue('mockToken');

      const result = await service.getEmailRecipients('', '', false, '', '');
      expect(result).toEqual('');
      expect(logger.error).toHaveBeenCalledWith(
        'Invalid response format from emailRecipients API',
        {},
      );
    });

    it('should return an empty string and log error on exception', async () => {
      jest.spyOn(clientTokenService, 'getClientToken').mockResolvedValue('mockToken');
      jest.spyOn(httpService, 'request').mockImplementation(() => {
        throw new Error('API Error With Logging');
      });

      const result = await service.getEmailRecipients('', '', false, '', '');
      expect(result).toEqual('');
      expect(logger.error).toHaveBeenCalledWith(
        'Error occurred during the API call to emailRecipients',
        'API Error With Logging',
      );
    });
  });

  describe('getEmailRecipientList', () => {
    it('should return error when API is disabled', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'app.recipientsListApiEnabled') {
          return false;
        }
        return null;
      });

      const payload: EmailRecipientListRequestDto = {
        emailType: 'SUBMISSIONREMINDER',
        plantIdList: [1, 3, 5],
      };

      const result = await service.getEmailRecipientList(payload);
      
      expect(result.hasError).toBe(true);
      expect(result.errorMessage).toBe('Recipients list API is disabled');
      expect(result.recipients).toEqual([]);
    });

    it('should return recipient list when API call is successful', async () => {
      const mockRecipients = [
        { 
          emailAddressList: 'Trey Lightsey <test1@example.com>',
          plantIdList: [5, 3, 1]
        },
        { 
          emailAddressList: 'Brad Vick <test2@example.com>',
          plantIdList: [3, 1, 5]
        },
      ];
      
      const mockResponse: AxiosResponse<typeof mockRecipients> = {
        data: mockRecipients,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { method: 'GET', headers: {} as AxiosHeaders },
      };

      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'app.recipientsListApiEnabled') {
          return true;
        } else if (key === 'app.recipientsListApi') {
          return 'http://mock-recipients-list-api.com';
        } else if (key === 'app.apiKey') {
          return 'mockApiKey';
        } else if (key === 'app.clientId') {
          return 'mockClientId';
        } else if (key === 'app.authApi.uri') {
          return 'http://mock-auth-api.com';
        } else if (key === 'app.clientSecret') {
          return 'mockClientSecret';
        }
        return null;
      });

      jest.spyOn(httpService, 'request').mockReturnValue(of(mockResponse) as any);
      jest.spyOn(clientTokenService, 'getClientToken').mockResolvedValue('mockToken');

      const payload: EmailRecipientListRequestDto = {
        emailType: 'SUBMISSIONREMINDER',
        plantIdList: [1, 3, 5],
      };

      const result = await service.getEmailRecipientList(payload);
      
      expect(result.hasError).toBe(false);
      expect(result.errorMessage).toBe('');
      expect(result.recipients).toEqual(mockRecipients);
      
      // Verify the API was called with correct body
      expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          emailType: 'SUBMISSIONREMINDER',
          plantIdList: [1,3,5],
        }),
      }));
    });

    it('should return error when API call fails', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'app.recipientsListApiEnabled') {
          return true;
        } else if (key === 'app.recipientsListApi') {
          return 'http://mock-recipients-list-api.com';
        } else if (key === 'app.apiKey') {
          return 'mockApiKey';
        } else if (key === 'app.clientId') {
          return 'mockClientId';
        } else if (key === 'app.authApi.uri') {
          return 'http://mock-auth-api.com';
        } else if (key === 'app.clientSecret') {
          return 'mockClientSecret';
        }
        return null;
      });

      jest.spyOn(clientTokenService, 'getClientToken').mockResolvedValue('mockToken');
      jest.spyOn(httpService, 'request').mockImplementation(() => {
        throw new Error('Network error');
      });

      const payload: EmailRecipientListRequestDto = {
        emailType: 'SUBMISSIONREMINDER',
        plantIdList: [1, 3, 5],
      };

      const result = await service.getEmailRecipientList(payload);
      
      expect(result.hasError).toBe(true);
      expect(result.errorMessage).toBe('Network error');
      expect(result.recipients).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        'Error occurred in getEmailRecipientList',
        'Network error',
      );
    });

    it('should return error with response details when API returns error response', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'app.recipientsListApiEnabled') {
          return true;
        } else if (key === 'app.recipientsListApi') {
          return 'http://mock-recipients-list-api.com';
        } else if (key === 'app.apiKey') {
          return 'mockApiKey';
        } else if (key === 'app.clientId') {
          return 'mockClientId';
        } else if (key === 'app.authApi.uri') {
          return 'http://mock-auth-api.com';
        } else if (key === 'app.clientSecret') {
          return 'mockClientSecret';
        }
        return null;
      });

      const errorWithResponse = new Error('API Error') as any;
      errorWithResponse.response = {
        status: 400,
        data: { message: 'Bad Request' },
      };

      jest.spyOn(clientTokenService, 'getClientToken').mockResolvedValue('mockToken');
      jest.spyOn(httpService, 'request').mockImplementation(() => {
        throw errorWithResponse;
      });

      const payload: EmailRecipientListRequestDto = {
        emailType: 'SUBMISSIONREMINDER',
        plantIdList: [1, 3, 5],
      };

      const result = await service.getEmailRecipientList(payload);
      
      expect(result.hasError).toBe(true);
      expect(result.errorMessage).toBe('HTTP 400: API Error');
      expect(result.recipients).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith('API response error status:', 400);
      expect(logger.error).toHaveBeenCalledWith('API response error data:', { message: 'Bad Request' });
    });
  });
});
