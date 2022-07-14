require('dotenv').config();
import { registerAs } from '@nestjs/config';
import { parseBool } from '@us-epa-camd/easey-common/utilities';

const path = process.env.EASEY_CAMD_SERVICES_PATH || 'camd-services';
const host = process.env.EASEY_CAMD_SERVICES_HOST || 'localhost';
const port = +process.env.EASEY_CAMD_SERVICES_PORT || 8060;

let uri = `https://${host}/${path}`;

if (host == 'localhost') {
  uri = `http://localhost:${port}/${path}`;
}

export default registerAs('app', () => ({
  name: 'notifications-api',
  title:
    process.env.EASEY_CAMD_SERVICES_TITLE ||
    'CAMD Administrative & General Services',
  path,
  host,
  apiHost: process.env.EASEY_API_GATEWAY_HOST || 'api.epa.gov/easey/dev',
  port,
  timeout: process.env.EASEY_CAMD_SERVICES_TIMEOUT || 1800000,
  uri,
  env: process.env.EASEY_CAMD_SERVICES_ENV || 'local-dev',
  enableCors: parseBool(process.env.EASEY_CAMD_SERVICES_ENABLE_CORS, true),
  enableApiKey: parseBool(process.env.EASEY_CAMD_SERVICES_ENABLE_API_KEY, true),
  enableAuthToken: parseBool(process.env.EASEY_CAMD_SERVICES_ENABLE_AUTH_TOKEN),
  enableClientToken: parseBool(
    process.env.EASEY_CAMD_SERVICES_ENABLE_CLIENT_TOKEN,
    true,
  ),
  enableGlobalValidationPipes: parseBool(
    process.env.EASEY_CAMD_SERVICES_ENABLE_GLOBAL_VALIDATION_PIPE,
    true,
  ),
  version: process.env.EASEY_CAMD_SERVICES_VERSION || 'v0.0.0',
  published: process.env.EASEY_CAMD_SERVICES_PUBLISHED || 'local',
  smtpHost: process.env.EASEY_CAMD_SERVICES_SMTP_HOST || 'smtp.epa.gov',
  smtpPort: +process.env.EASEY_CAMD_SERVICES_SMTP_PORT || 25,
  authApi: {
    uri: process.env.EASEY_AUTH_API || 'https://localhost:8000/auth-mgmt',
  },
  apiKey: process.env.EASEY_CAMD_SERVICES_API_KEY,
  camdInbox: process.env.EASEY_CAMD_SERVICES_CAMD_INBOX,
  ecmpsInbox: process.env.EASEY_CAMD_SERVICES_ECMPS_INBOX,
}));
