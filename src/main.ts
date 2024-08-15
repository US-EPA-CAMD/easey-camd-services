import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  applyMiddleware,
  applySwagger,
} from '@us-epa-camd/easey-common/nestjs';
import { useContainer } from 'class-validator';

import { AppModule } from './app.module';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  await applyMiddleware(AppModule, app, true);
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
