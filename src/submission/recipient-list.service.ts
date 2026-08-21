import { Injectable } from '@nestjs/common';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import * as https from 'https';
import * as crypto from 'crypto';
import { EmailRecipientListRequestDto } from '../dto/email-recipient-list-request.dto';
import { EmailRecipientListResponseDto, EmailRecipientDto } from '../dto/email-recipient-list-response.dto';
import { ClientTokenService } from '../client-token/client-token.service';


@Injectable()
export class RecipientListService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly entityManager: EntityManager,
    private readonly logger: Logger,
    private readonly clientTokenService: ClientTokenService,
  ) {}

  returnManager() {
    return this.entityManager;
  }

  async getEmailRecipients(
    userId: string,
    submissionType: string,
    isMats: boolean = false,
    emailType: string = 'SUBMISSIONCONFIRMATION',
    plantId: string = '0',
  ): Promise<string> {

    this.logger.debug('getEmailRecipients with params', { emailType, plantId, userId, submissionType, isMats });

    const body = {
      emailType: emailType,
      plantId: plantId,
      submissionType: submissionType,
      userId: userId,
      isMats: isMats,
    };

    try {
      const response = await this.callRecipientListAPI(body);

      const emailList = response
        .map(item => item.emailAddressList)
        .filter(emailAddressList => emailAddressList)
        .flatMap(emailList => emailList.split(',').map(email => email.trim()))
        .filter(email => email !== '')
        .join(',');

      return emailList;
    } catch (error) {
      this.logger.error('Error occurred during the API call to emailRecipients', error.message);
      // Check if the error has a response (e.g., HTTP status code errors)
      if (error.response) {
        this.logger.error('API response error status:', error.response.status || '');
        this.logger.error('API response error data:', error.response.data || '');
      }

      return '';
    }
  }

  private async callRecipientListAPI(body: any): Promise<EmailRecipientDto[]> {
    const recipientsListApiUrl = this.configService.get<string>('app.recipientsListApi');
    if (!recipientsListApiUrl) {
      this.logger.error('recipientsListApiUrl is not configured');
      throw new Error('recipientsListApiUrl is not configured');
    }

    this.logger.debug('using recipientsListApiUrl: ' + recipientsListApiUrl);

    //Obtain client token
    const clientToken = await this.clientTokenService.getClientToken();
    if (!clientToken) {
      this.logger.error('Unable to obtain client token from auth-api. Cannot proceed with emailRecipients API call');
      throw new Error('Unable to obtain client token');
    }

    const headers = {
      ...this.clientTokenService.buildAuthHeaders(clientToken),
      'Content-Type': 'application/json',
    };

    this.logger.debug('Making API call to:', { url: recipientsListApiUrl });

    const allowLegacyRenegotiationforNodeJsOptions = {
      httpsAgent: new https.Agent({
        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
      }),
    };

    // httpService.request is used so the body can be sent regardless of verb (axios can't send a body with GET).
    // The CBS API expects a GET request with a body, CAPAS expects POST.
    const method = this.configService.get<string>('app.recipientsListApiMethod');
    const response: AxiosResponse<any> = await firstValueFrom(
      this.httpService.request({
        method: method === 'POST' ? 'POST' : 'GET',
        url: recipientsListApiUrl,
        headers: headers,
        data: body,
        ...allowLegacyRenegotiationforNodeJsOptions,
      }),
    );

    if (!response.data || !Array.isArray(response.data)) {
      this.logger.error('Invalid response format from emailRecipients API', response.data);
      throw new Error('Invalid response format from emailRecipients API');
    }

    if (Array.isArray(response.data) && response.data.length > 0) {
      this.logger.debug('First item of the email list: ', response.data[0]);
    } else {
      this.logger.debug('response.data is is empty.');
    }

    return response.data;
  }

  async getEmailRecipientList(
    payload: EmailRecipientListRequestDto,
  ): Promise<EmailRecipientListResponseDto> {
    try {

      const notificationType = payload.emailType; //For logging purposes only (CodeQL) complains if variables with *email* in their names are logged
      this.logger.log(`RecipientListService.getEmailRecipientList - Processing request for emailType: ${notificationType}, plantIds: [${payload.plantIdList?.join(', ') || 'none'}]`);

      // Check if API is enabled
      const isApiEnabled = this.configService.get<boolean>('app.recipientsListApiEnabled');
      if (!isApiEnabled) {
        this.logger.error('Recipients list API is disabled');
        return {
          recipients: [],
          hasError: true,
          errorMessage: 'Recipients list API is disabled',
        };
      }

      //CBS recipient api expects plantIdList to be a number. Send as is.
      const body = {
        emailType: payload.emailType,
        plantIdList: payload.plantIdList,
      };
      
      const recipientData = await this.callRecipientListAPI(body);

      return {
        recipients: recipientData,
        hasError: false,
        errorMessage: '',
      };
    } catch (error) {
      this.logger.error('Error occurred in getEmailRecipientList', error.message);
      
      // Log additional error details if available
      if (error.response) {
        this.logger.error('API response error status:', error.response.status || '');
        this.logger.error('API response error data:', error.response.data || '');
      }

      // Extract meaningful error message with simple, safe checks
      let errorMessage = 'An error occurred while fetching recipient list';
      
      if (error?.response?.status && error?.message) {
        errorMessage = `HTTP ${error.response.status}: ${error.message}`;
      } else if (error?.response?.status) {
        errorMessage = `HTTP ${error.response.status} error from recipients API`;
      } else if (error?.code) {
        errorMessage = 'Error connecting to recipients API';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Always return structured response, no exceptions
      return {
        recipients: [],
        hasError: true,
        errorMessage: errorMessage,
      };
    }
  }
}
