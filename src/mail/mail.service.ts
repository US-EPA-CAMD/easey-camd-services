import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { getManager } from 'typeorm';
import { CreateMailDto } from 'src/dto/create-mail.dto';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { ConfigService } from '@nestjs/config';
import { Api } from '../entities/api.entity';

const nodeEmailer = require('nodemailer');
let transporter;

@Injectable()
export class MailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    transporter = nodeEmailer.createTransport({
      host: configService.get<string>('app.smtpHost'),
      port: configService.get<number>('app.smtpPort'),
      secure: false, // true for 465, false for other ports
    });
  }

  returnManager(): any {
    return getManager();
  }

  async sendEmail(
    request: Request,
    createMailDTO: CreateMailDto,
  ): Promise<void> {
    const apiRecord = await this.returnManager().findOne(
      Api,
      request.headers['x-client-id'],
    );

    let toInbox;
    if (apiRecord.name === 'camd-ui') {
      toInbox = this.configService.get<string>('app.camdInbox');
    } else {
      toInbox = this.configService.get<string>('app.ecmpsInbox');
    }

    try {
      await transporter.sendMail({
        from: createMailDTO.fromEmail, // sender address
        to: toInbox, // list of receivers
        subject: createMailDTO.subject, // Subject line
        text: createMailDTO.message,
      });
    } catch (e) {
      this.logger.error(InternalServerErrorException, e, true);
    }
    this.logger.info('Successfully sent an email', {
      from: createMailDTO.fromEmail,
    });
  }
}
