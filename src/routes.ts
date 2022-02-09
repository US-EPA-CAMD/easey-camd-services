import { Routes } from 'nest-router';

import { MailModule } from './mail/mail.module';

const routes: Routes = [
  {
    path: '/email',
    module: MailModule,
  },
];

export default routes;
