import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';

@Module({
  imports: [HttpModule],
  controllers: [MailController],
  providers: [MailService],
})
export class MailModule {}
