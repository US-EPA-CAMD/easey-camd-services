import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  applySwagger,
  applyMiddleware,
} from '@us-epa-camd/easey-common/nestjs';

import { AppModule } from './app.module';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await applyMiddleware(AppModule, app);
  await applySwagger(app);

  const configService = app.get(ConfigService);
  const appPath = configService.get<string>('app.path');
  const appPort = configService.get<number>('app.port');
  const enableDebug = configService.get<boolean>('app.enableDebug');

  const server = await app.listen(appPort);
  server.setTimeout(1800000);

  if (enableDebug) {
    console.log('config: ', configService.get('app'));
    console.log('s3Config: ', configService.get('s3Config'));
    console.log(
      `Application is running on: ${await app.getUrl()}/${appPath}/swagger`,
    );
  }
}

bootstrap();
