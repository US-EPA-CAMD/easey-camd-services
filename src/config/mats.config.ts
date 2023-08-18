import { registerAs } from '@nestjs/config';
import { getConfigValue } from '@us-epa-camd/easey-common/utilities';

require('dotenv').config();

export default registerAs('matsConfig', () => ({
  bucket: getConfigValue('EASEY_CAMD_SERVICES_MATS_BULK_FILES_IMPORT_BUCKET'),
  region: getConfigValue('EASEY_CAMD_SERVICES_AWS_S3_REGION', 'us-gov-west-1'),
  credentials: {
    accessKeyId: getConfigValue('EASEY_CAMD_SERVICES_MATS_BULK_FILES_IMPORT_AWS_SECRET_ACCESS_KEY'),
    secretAccessKey: getConfigValue('EASEY_CAMD_SERVICES_MATS_BULK_FILES_IMPORT_AWS_ACCESS_KEY_ID'),
  },
}));
