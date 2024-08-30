import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { ConfigService } from '@nestjs/config';
import { ClientConfig } from '../entities/client-config.entity';
import { ServerErrorDto } from '../dto/server-error.dto';

@Injectable()
export class LoggingService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  returnManager(): EntityManager {
    return this.entityManager;
  }

  async logServerError(
    request: Request,
    errorDto: ServerErrorDto,
  ): Promise<void> {
    const dbRecord = await this.returnManager().findOneBy(ClientConfig, {
      id: request.headers['x-client-id'],
    });

    this.logger.info(errorDto.errorMessage, {
      appName: dbRecord.name,
      ...errorDto.metadata,
    });
  }
}
