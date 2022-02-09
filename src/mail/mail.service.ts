import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateMailDto } from 'src/dto/create-mail.dto';
import { Logger } from '@us-epa-camd/easey-common/logger';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly logger: Logger,
  ) {}

  async sendEmail(createMailDTO: CreateMailDto): Promise<void> {
    this.mailerService
      .sendMail({
        to: createMailDTO.toEmail, // list of receivers
        from: createMailDTO.fromEmail, // sender address
        subject: createMailDTO.subject, // Subject line
        template: './testTemplate',
        context: {
          url: 'www.google.com',
        },
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
