import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { of } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { ClientTokenService } from './client-token.service';

describe('ClientTokenService', () => {
  let service: ClientTokenService;
  let httpService: HttpService;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientTokenService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'app.authApi.uri':
                  return 'http://mock-auth-api.com';
                case 'app.apiKey':
                  return 'mockApiKey';
                case 'app.clientId':
                  return 'mockClientId';
                case 'app.clientSecret':
                  return 'mockClientSecret';
                default:
                  return null;
              }
            }),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
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

    service = module.get<ClientTokenService>(ClientTokenService);
    httpService = module.get<HttpService>(HttpService);
    logger = module.get<Logger>(Logger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClientToken', () => {
    it('should return a token when the API call is successful', async () => {
      const mockResponse: AxiosResponse<{ token: string }> = {
        data: { token: 'mockToken' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { method: 'post', headers: {} as AxiosHeaders },
      };
      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse) as any);

      const result = await service.getClientToken();

      expect(result).toEqual('mockToken');
      expect(httpService.post).toHaveBeenCalledWith(
        'http://mock-auth-api.com/tokens/client',
        { clientId: 'mockClientId', clientSecret: 'mockClientSecret' },
        { headers: { 'x-api-key': 'mockApiKey' } },
      );
    });

    it('should return an empty string when the API returns no data', async () => {
      const mockResponse: AxiosResponse<null> = {
        data: null,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { method: 'post', headers: {} as AxiosHeaders },
      };
      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse) as any);

      const result = await service.getClientToken();

      expect(result).toEqual('');
      expect(logger.error).toHaveBeenCalledWith(
        'Invalid response from auth-api client token endpoint',
      );
    });

    it('should return an empty string and log the error on exception', async () => {
      const error = new Error('API Error');
      jest.spyOn(httpService, 'post').mockImplementation(() => {
        throw error;
      });

      const result = await service.getClientToken();

      expect(result).toEqual('');
      expect(logger.error).toHaveBeenCalledWith(
        'Error obtaining client token from auth-api',
        error.message,
      );
    });
  });

  describe('buildAuthHeaders', () => {
    it('should build the client-token auth headers', () => {
      expect(service.buildAuthHeaders('mockToken')).toEqual({
        'x-api-key': 'mockApiKey',
        'x-client-id': 'mockClientId',
        Authorization: 'Bearer mockToken',
      });
    });
  });
});
