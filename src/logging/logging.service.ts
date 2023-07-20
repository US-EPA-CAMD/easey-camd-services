import { Injectable } from '@nestjs/common';
import { getManager } from 'typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { ConfigService } from '@nestjs/config';
import { ClientConfig } from '../entities/client-config.entity';
import { ServerErrorDto } from '../dto/server-error.dto';

@Injectable()
export class LoggingService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  returnManager(): any {
    return getManager();
  }

  async logServerError(
    request: Request,
    errorDto: ServerErrorDto,
  ): Promise<void> {
    const dbRecord = await this.returnManager().findOne(
      ClientConfig,
      request.headers['x-client-id'],
    );

    this.logger.log(errorDto.errorMessage, {
      appName: dbRecord.name,
      ...errorDto.metadata,
    });
  }
}
