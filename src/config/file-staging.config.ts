import { registerAs } from '@nestjs/config';
import { getConfigValue } from '@us-epa-camd/easey-common/utilities';

require('dotenv').config();

// Bucket for staging bulk-import files, with its own service credentials.
export default registerAs('fileStagingConfig', () => ({
  bucket: getConfigValue('EASEY_CAMD_SERVICES_FILE_STAGING_BUCKET'),
  region: getConfigValue('EASEY_BULK_FILES_AWS_REGION', 'us-gov-west-1'),
  credentials: {
    accessKeyId: getConfigValue(
      'EASEY_CAMD_SERVICES_FILE_STAGING_AWS_ACCESS_KEY_ID',
    ),
    secretAccessKey: getConfigValue(
      'EASEY_CAMD_SERVICES_FILE_STAGING_AWS_SECRET_ACCESS_KEY',
    ),
  },
}));
