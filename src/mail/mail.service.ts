import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CreateMailDto } from '../dto/create-mail.dto';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { ConfigService } from '@nestjs/config';
import { ClientConfig } from '../entities/client-config.entity';
import { LoggingException } from '@us-epa-camd/easey-common/exceptions';

const nodeEmailer = require('nodemailer');
let transporter = null;

@Injectable()
export class MailService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    transporter = nodeEmailer.createTransport({
      host: this.configService.get<string>('app.smtpHost'),
      port: this.configService.get<number>('app.smtpPort'),
      secure: false, // true for 465, false for other ports
    });
  }

  returnManager() {
    return this.entityManager;
  }

  async sendEmail(clientId: string, payload: CreateMailDto): Promise<void> {
    const dbRecord = await this.returnManager().findOneBy<ClientConfig>(
      ClientConfig,
      { id: clientId },
    );
    console.log(dbRecord);

    try {
      await transporter.sendMail({
        from: payload.fromEmail, // sender address
        to: dbRecord.supportEmail, // list of receivers
        subject: payload.subject, // Subject line
        text: payload.message,
      });
    } catch (e) {
      throw new LoggingException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    this.logger.info('Successfully sent an email', {
      from: payload.fromEmail,
    });
  }
}
