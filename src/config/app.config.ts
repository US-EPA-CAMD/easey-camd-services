import { registerAs } from '@nestjs/config';
import {
  getConfigValue,
  getConfigValueNumber,
  getConfigValueBoolean,
} from '@us-epa-camd/easey-common/utilities';

require('dotenv').config();

const path = getConfigValue('EASEY_CAMD_SERVICES_PATH', 'camd-services');
const host = getConfigValue('EASEY_CAMD_SERVICES_HOST', 'localhost');
const port = getConfigValueNumber('EASEY_CAMD_SERVICES_PORT', 8060);

let uri = `https://${host}/${path}`;

if (host == 'localhost') {
  uri = `http://localhost:${port}/${path}`;
}

export default registerAs('app', () => ({
  name: 'camd-services',
  host, port, path, uri,
  title: getConfigValue(
    'EASEY_CAMD_SERVICES_TITLE', 'CAMD Administrative & General Services',
  ),
  description: getConfigValue(
    'EASEY_CAMD_SERVICES_DESCRIPTION',
    '',
  ),
  apiHost: getConfigValue(
    'EASEY_API_GATEWAY_HOST', 'api.epa.gov/easey/dev',
  ),
  apiKey: getConfigValue(
    'EASEY_CAMD_SERVICES_API_KEY',
  ),
  env: getConfigValue(
    'EASEY_CAMD_SERVICES_ENV', 'local-dev',
  ),
  enableCors: getConfigValueBoolean(
    'EASEY_CAMD_SERVICES_ENABLE_CORS', true,
  ),
  enableApiKey: getConfigValueBoolean(
    'EASEY_CAMD_SERVICES_ENABLE_API_KEY',
  ),
  enableClientToken: getConfigValueBoolean(
    'EASEY_CAMD_SERVICES_ENABLE_CLIENT_TOKEN',
  ),
  enableGlobalValidationPipes: getConfigValueBoolean(
    'EASEY_CAMD_SERVICES_ENABLE_GLOBAL_VALIDATION_PIPE', true,
  ),
  version: getConfigValue(
    'EASEY_CAMD_SERVICES_VERSION', 'v0.0.0',
  ),
  published: getConfigValue(
    'EASEY_CAMD_SERVICES_PUBLISHED', 'local',
  ),
  smtpHost: getConfigValue(
    'EASEY_CAMD_SERVICES_SMTP_HOST', 'smtp.epa.gov',
  ),
  smtpPort: getConfigValueNumber(
    'EASEY_CAMD_SERVICES_SMTP_PORT', 25,
  ),
  authApi: {
    uri: getConfigValue(
      'EASEY_AUTH_API', 'https://api.epa.gov/easey/dev/auth-mgmt',
    ),
  },
  secretToken: getConfigValue(
    'EASEY_CAMD_SERVICES_SECRET_TOKEN',
  ),
  enableSecretToken: getConfigValueBoolean(
    'EASEY_CAMD_SERVICES_ENABLE_SECRET_TOKEN',
  ),
  // ENABLES DEBUG CONSOLE LOGS
  enableDebug: getConfigValueBoolean(
    'EASEY_CAMD_SERVICES_ENABLE_DEBUG',
  ),
}));