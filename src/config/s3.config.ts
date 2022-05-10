import { registerAs } from '@nestjs/config';

export default registerAs('s3Config', () => ({
  accessKeyId: process.env.EASEY_CAMD_SERVICES_S3_ACCESS_KEY,
  secretAccessKey: process.env.EASEY_CAMD_SERVICES_S3_SECRET_ACCESS_KEY,
  region: process.env.EASEY_CAMD_SERVICES_S3_REGION,
  bucket: process.env.EASEY_CAMD_SERVICES_S3_BUCKET,
}));
