import { Module } from '@nestjs/common';
import { RouterModule } from 'nest-router';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { dbConfig } from '@us-epa-camd/easey-common/config';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { CorsOptionsModule } from '@us-epa-camd/easey-common/cors-options';

import routes from './routes';
import appConfig from './config/app.config';
import { TypeOrmConfigService } from './config/typeorm.config';

import { BookmarkModule } from './bookmark/bookmark.module';
import { BulkFileModule } from './bulkFile/bulk-file.module';
import s3Config from './config/s3.config';
import { MailModule } from './mail/mail.module';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [
    RouterModule.forRoutes(routes),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [dbConfig, appConfig, s3Config],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    LoggerModule,
    CorsOptionsModule,
    BookmarkModule,
    MailModule,
    BulkFileModule,
    LoggingModule,
  ],
})
export class AppModule {}
