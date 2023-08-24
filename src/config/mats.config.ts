import { registerAs } from '@nestjs/config';
import { getConfigValue } from '@us-epa-camd/easey-common/utilities';

require('dotenv').config();

export default registerAs('matsConfig', () => ({
  importBucket: getConfigValue('EASEY_CAMD_SERVICES_MATS_BULK_FILES_IMPORT_BUCKET'),
  importRegion: getConfigValue('EASEY_BULK_FILES_AWS_REGION', 'us-gov-west-1'),
  importCredentials: {
    accessKeyId: getConfigValue('EASEY_CAMD_SERVICES_MATS_BULK_FILES_IMPORT_AWS_ACCESS_KEY_ID'),
    secretAccessKey: getConfigValue('EASEY_CAMD_SERVICES_MATS_BULK_FILES_IMPORT_AWS_SECRET_ACCESS_KEY'),
  },
  globalBucket: getConfigValue('EASEY_CAMD_SERVICES_MATS_BULK_FILES_BUCKET'),
  globalRegion: getConfigValue('EASEY_BULK_FILES_AWS_REGION', 'us-gov-west-1'),
  globalCredentials: {
    accessKeyId: getConfigValue('EASEY_BULK_FILES_AWS_ACCESS_KEY_ID'),
    secretAccessKey: getConfigValue('EASEY_BULK_FILES_AWS_SECRET_ACCESS_KEY'),
  },

}));
