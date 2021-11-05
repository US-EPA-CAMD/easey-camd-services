import { registerAs } from '@nestjs/config';

const path = process.env.EASEY_NOTIFICATIONS_API_PATH || 'api/notifications-mgmt';
const host = process.env.EASEY_NOTIFICATIONS_API_HOST || 'localhost';
const port = process.env.EASEY_NOTIFICATIONS_API_PORT || 3000;
////
let uri = `https://${host}/${path}`;

if (host == 'localhost') {
  uri = `http://localhost:${port}/${path}`;
}

export default registerAs('app', () => ({
  name: 'notifications-api',
  title: process.env.EASEY_NOTIFICATIONS_API_TITLE || 'Notifications Management',
  path,
  host,
  port,
  uri,
  env: process.env.EASEY_NOTIFICATIONS_API_ENV || 'local-dev',
  version: process.env.EASEY_NOTIFICATIONS_API_VERSION || 'v0.0.0',
  published: process.env.EASEY_NOTIFICATIONS_API_PUBLISHED || 'local',
  smtpHost: process.env.EASEY_NOTIFICATIONS_API_STMP_HOST || 'smtp.epa.gov',
  smtpPort: process.env.EASEY_NOTIFICATIONS_API_STMP_PORT || 25,
}));
