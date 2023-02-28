import { registerAs } from '@nestjs/config';
import {
  getConfigValue,
  getConfigValueNumber,
  getConfigValueBoolean,
} from '@us-epa-camd/easey-common/utilities';

require('dotenv').config();

const host = getConfigValue('EASEY_CAMD_SERVICES_HOST', 'localhost');
const port = getConfigValueNumber('EASEY_CAMD_SERVICES_PORT', 8060);
const path = getConfigValue('EASEY_CAMD_SERVICES_PATH', 'camd-services');

let uri = `https://${host}/${path}`;

if (host == 'localhost') {
  uri = `http://localhost:${port}/${path}`;
}

const apiHost = getConfigValue(
  'EASEY_API_GATEWAY_HOST',
  'api.epa.gov/easey/dev',
);

export const smtpHost = getConfigValue(
  'EASEY_CAMD_SERVICES_SMTP_HOST',
  'smtp.epa.gov',
);

export const smtpPort = getConfigValueNumber(
  'EASEY_CAMD_SERVICES_SMTP_PORT',
  25,
);

export default registerAs('app', () => ({
  name: 'camd-services',
  host,
  port,
  path,
  uri,
  title: getConfigValue(
    'EASEY_CAMD_SERVICES_TITLE',
    'CAMD Administrative & General Services',
  ),
  description: getConfigValue(
    'EASEY_CAMD_SERVICES_DESCRIPTION',
    'Provides administrative & general services for CAMD applications.',
  ),
  env: getConfigValue('EASEY_CAMD_SERVICES_ENV', 'local-dev'),
  apiKey: getConfigValue('EASEY_CAMD_SERVICES_API_KEY'),
  enableApiKey: getConfigValueBoolean('EASEY_CAMD_SERVICES_ENABLE_API_KEY'),
  enableClientToken: getConfigValueBoolean(
    'EASEY_CAMD_SERVICES_ENABLE_CLIENT_TOKEN',
  ),
  enableRoleGuard: getConfigValueBoolean(
    'EASEY_CAMD_SERVICES_ENABLE_ROLE_GUARD',
    true,
  ),
  enableAuthToken: getConfigValueBoolean(
    'EASEY_CAMD_SERVICES_ENABLE_AUTH_TOKEN',
    true,
  ),
  secretToken: getConfigValue('EASEY_CAMD_SERVICES_SECRET_TOKEN'),
  enableSecretToken: getConfigValueBoolean(
    'EASEY_CAMD_SERVICES_ENABLE_SECRET_TOKEN',
  ),
  enableCors: getConfigValueBoolean('EASEY_CAMD_SERVICES_ENABLE_CORS', true),
  enableGlobalValidationPipes: getConfigValueBoolean(
    'EASEY_CAMD_SERVICES_ENABLE_GLOBAL_VALIDATION_PIPE',
    true,
  ),
  version: getConfigValue('EASEY_CAMD_SERVICES_VERSION', 'v0.0.0'),
  published: getConfigValue('EASEY_CAMD_SERVICES_PUBLISHED', 'local'),
  // ENABLES DEBUG CONSOLE LOGS
  enableDebug: getConfigValueBoolean('EASEY_CAMD_SERVICES_ENABLE_DEBUG'),
  // NEEDS TO BE SET IN .ENV FILE FOR LOCAL DEVELOPMENT
  // FORMAT: { "userId": "", "roles": [ { "orisCode": 3, "role": "P" } ] }
  currentUser: getConfigValue('EASEY_CAMD_SERVICES_CURRENT_USER'),
  apiHost: apiHost,
  authApi: {
    uri: getConfigValue('EASEY_AUTH_API', `https://${apiHost}/auth-mgmt`),
  },
  streamingApiUrl: getConfigValue(
    'EASEY_STREAMING_SERVICES',
    `https://${apiHost}/streaming-services`,
  ),
}));
