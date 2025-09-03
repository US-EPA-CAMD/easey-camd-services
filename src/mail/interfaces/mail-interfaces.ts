import { Attachment } from 'nodemailer/lib/mailer';

export interface SendMailOptions {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Attachment[];
  [key: string]: any; // Allow additional nodemailer options
}

