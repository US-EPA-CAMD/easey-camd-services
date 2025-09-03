import {
  ApiTags,
  ApiOkResponse,
  ApiSecurity,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ClientTokenGuard } from '@us-epa-camd/easey-common/guards';
import { AuditLog } from '@us-epa-camd/easey-common/decorators';
import { Logger } from '@us-epa-camd/easey-common/logger';

import { MailService } from './mail.service';
import { CreateMailDto } from '../dto/create-mail.dto';
import { ClientId } from '../decorators/client-id.decorator';
import { ProcessMailDTO } from '../dto/process-mail.dto';
import { MassEvalParamsDTO } from '../dto/mass-eval-params.dto';
import { EaseyContentTemplateService } from './easey-content-template.service';
import { MailEvalService } from './mail-eval.service';
import { ApiExcludeEndpointByEnv } from '../decorators/swagger-decorator';
import { EmailRecipientListRequestDto } from '../dto/email-recipient-list-request.dto';
import { EmailRecipientListResponseDto } from '../dto/email-recipient-list-response.dto';
import { EmailProcessResponseDto } from '../dto/email-process-response.dto';
import { RecipientListService } from '../submission/recipient-list.service';

@Controller()
@ApiTags('Support')
@ApiSecurity('APIKey')
@ApiSecurity('ClientId')
@ApiBearerAuth('ClientToken')
@UseGuards(ClientTokenGuard)
export class MailController {
  constructor(
    private mailService: MailService,
    private easeyContentTemplateService: EaseyContentTemplateService,
    private mailEvalService: MailEvalService,
    private recipientListService: RecipientListService,
    private readonly logger: Logger,
  ) {}

  @Post('contact-us')
  @ApiExcludeEndpointByEnv()
  @ApiOkResponse({
    description: 'Data sent successfully',
  })
  @ApiOperation({
    description:
      'Sends an email to a CAMD support inbox determined by the Client Id.',
  })
  @ApiInternalServerErrorResponse()
  @AuditLog({
    label:'Contact us email sent',
    requestHeadersOutFields: ['x-client-id']
  })
  async send(@Body() payload: CreateMailDto, @ClientId() clientId: string) {
    await this.mailService.sendEmail(clientId, payload);
  }

  @Post('email/process')
  @ApiExcludeEndpointByEnv()
  @ApiOkResponse({
    description: 'Data sent successfully',
    type: EmailProcessResponseDto,
  })
  @ApiOperation({
    description:
      'Processes an email using the associated email record stored in the email_queue',
  })
  @ApiInternalServerErrorResponse()
  @AuditLog({
    label:'Email processed',
    requestHeadersOutFields: ['x-client-id'],
    requestBodyOutFields: ['emailToSendId']
  })
  async sendRecord(@Body() payload: ProcessMailDTO): Promise<EmailProcessResponseDto> {
    return await this.easeyContentTemplateService.sendEmailRecord(payload.emailToSendId);
  }

  @Post('email/mass-eval')
  @ApiExcludeEndpointByEnv()
  @ApiOkResponse({
    description: 'Data sent successfully',
  })
  @ApiOperation({
    description:
      'Sends an email to a CAMD support inbox determined by the Client Id.',
  })
  @ApiInternalServerErrorResponse()
  @AuditLog({
    label:'Mass evaluation email sent',
    requestHeadersOutFields: ['x-client-id'],
    requestBodyOutFields: ['evaluationSetId']
  })
  async sendMassEval(@Body() payload: MassEvalParamsDTO) {
    await this.mailEvalService.sendMassEvalEmail(
      payload.toEmail,
      '',
      payload.fromEmail,
      payload.evaluationSetId
    );
  }

  @Post('email/emailRecipientList')
  @ApiOkResponse({
    description: 'Email recipient list retrieved successfully',
    type: EmailRecipientListResponseDto,
  })
  @ApiOperation({
    description:
      'Retrieves a list of email recipients based on email type and plant IDs.',
  })
  @ApiInternalServerErrorResponse()
  @AuditLog({
    label:'Email recipient list retrieved',
    requestHeadersOutFields: ['x-client-id'],
    requestBodyOutFields: ['emailType', 'plantIdList']
  })
  async getEmailRecipientList(
    @Body() payload: EmailRecipientListRequestDto,
  ): Promise<EmailRecipientListResponseDto> {
    return await this.recipientListService.getEmailRecipientList(payload);
  }
}
