import { Injectable } from '@nestjs/common';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class RecipientListService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly entityManager: EntityManager,
    private readonly logger: Logger,
  ) {}

  returnManager() {
    return this.entityManager;
  }

  async getEmailRecipients(
    emailType: string = 'SUBMISSIONCONFIRMATION',
    plantId: number = 0,
    userId: string = 'defaultUserId',
    submissionType?: string,
    isMats: boolean = false,
  ): Promise<string> {

    this.logger.debug('getEmailRecipients with params', { emailType, plantId, userId, submissionType, isMats });

    const recipientsListApi = this.configService.get<string>('app.recipientsListApi');
    if (!recipientsListApi) {
      this.logger.error('recipientsListApi is not configured');
      return '';
    }

    const url = `${recipientsListApi}/api/auth-mgmt/emailRecipients`
    this.logger.debug('using recipientsListApi: ' + url);

    const headers = {
      Authorization: `Bearer ${userId}`,
    };

    const body = {
      emailType,
      plantId,
      userId,
      submissionType,
      isMats,
    };

    try {
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.post(url, body, { headers }),
      );

      if (!response.data || !Array.isArray(response.data)) {
        this.logger.error('Invalid response format from emailRecipients API');
        return '';
      }

      const emailList = response.data
        .map(item => item.emailAddressList)
        .filter(emailAddressList => emailAddressList)
        .join(';');

      return emailList;
    } catch (error) {
      this.logger.error('Error occurred during the API call to emailRecipients', error);
      return '';
    }
  }
}
