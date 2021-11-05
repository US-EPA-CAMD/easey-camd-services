import { Routes } from 'nest-router';

import { MailModule } from './mail/mail.module';

const routes: Routes = [
  {
    path: '/mail',
    module: MailModule,
  },
];

export default routes;
