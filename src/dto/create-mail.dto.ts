import { ApiProperty } from '@nestjs/swagger';

export class CreateMailDto {
  @ApiProperty({
    description: 'Email address of recipient',
    example: 'kherceg@cvpcorp.com',
    name: 'toEmail',
  })
  toEmail: string;

  @ApiProperty({
    description: 'Email address of sender',
    example: 'noreply@epa.gov',
    name: 'fromEmail',
  })
  fromEmail: string;

  @ApiProperty({
    description: 'Subject of email message',
    name: 'subject',
  })
  subject: string;

  @ApiProperty({
    description: 'Content of email message',
    name: 'message',
  })
  message: string;
}
