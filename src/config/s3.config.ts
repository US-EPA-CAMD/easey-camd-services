import { registerAs } from '@nestjs/config';
import { getConfigValue } from '@us-epa-camd/easey-common/utilities';

require('dotenv').config();

export default registerAs('s3Config', () => ({
  bucket: getConfigValue('EASEY_BULK_FILES_AWS_BUCKET'),
  region: getConfigValue('EASEY_BULK_FILES_AWS_REGION', 'us-gov-west-1'),
  credentials: {
    accessKeyId: getConfigValue('EASEY_BULK_FILES_AWS_ACCESS_KEY_ID'),
    secretAccessKey: getConfigValue('EASEY_BULK_FILES_AWS_SECRET_ACCESS_KEY'),
  },
}));
