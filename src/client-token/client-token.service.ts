import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

// Mints and packages a client token for authenticating camd-services' outbound
// calls to other easey APIs (validated downstream by ClientTokenGuard).
@Injectable()
export class ClientTokenService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {}

  // Requests a client token from auth-mgmt using the configured client credentials.
  async getClientToken(): Promise<string> {
    const url = `${this.configService.get<string>('app.authApi.uri')}/tokens/client`;

    const headers = {
      'x-api-key': this.configService.get<string>('app.apiKey'),
    };
    const body = {
      clientId: this.configService.get<string>('app.clientId'),
      clientSecret: this.configService.get<string>('app.clientSecret'),
    };

    try {
      this.logger.debug('Calling auth-api token validation API: ' +  url);
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.post(url, body, { headers }),
      );
      if (!response.data) {
        this.logger.error('Invalid response from auth-api client token endpoint');
        return '';
      }
      return response.data.token;
    } catch (error) {
      this.logger.error('Error obtaining client token from auth-api', error.message);
      return '';
    }
  }

  // Standard headers for a client-token-authenticated request to an easey API.
  buildAuthHeaders(clientToken: string): Record<string, string> {
    return {
      'x-api-key': this.configService.get<string>('app.apiKey'),
      'x-client-id': this.configService.get<string>('app.clientId'),
      Authorization: `Bearer ${clientToken}`,
    };
  }
}
