import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateMailDto } from 'src/dto/create-mail.dto';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { ConfigService } from '@nestjs/config';

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

  async sendEmail(createMailDTO: CreateMailDto): Promise<void> {
    transporter
      .sendMail({
        from: createMailDTO.fromEmail, // sender address
        to: createMailDTO.toEmail, // list of receivers
        subject: createMailDTO.subject, // Subject line
        text: createMailDTO.message,
      })
      .then(() => {
        this.logger.info('Successfully sent an email', {
          to: createMailDTO.toEmail,
          from: createMailDTO.fromEmail,
        });
      })
      .catch((e) => {
        this.logger.error(InternalServerErrorException, e, true);
      });
  }
}
