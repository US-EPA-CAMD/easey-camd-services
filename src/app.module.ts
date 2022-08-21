import { Module } from '@nestjs/common';
import { RouterModule } from 'nest-router';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { dbConfig } from '@us-epa-camd/easey-common/config';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { CorsOptionsModule } from '@us-epa-camd/easey-common/cors-options';

import routes from './routes';
import s3Config from './config/s3.config';
import appConfig from './config/app.config';
import { TypeOrmConfigService } from './config/typeorm.config';

import { BulkFileModule } from './bulkFile/bulk-file.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { LoggingModule } from './logging/logging.module';
import { ReportModule } from './report/report.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    RouterModule.forRoutes(routes),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        s3Config,
        dbConfig,
        appConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    LoggerModule,
    CorsOptionsModule,
    BulkFileModule,
    BookmarkModule,
    LoggingModule,
    ReportModule,
    MailModule,
  ],
})
export class AppModule {}
