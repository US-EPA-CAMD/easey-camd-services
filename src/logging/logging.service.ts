import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { getManager } from 'typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { ConfigService } from '@nestjs/config';
import { Api } from '../entities/api.entity';
import { ServerErrorDto } from 'src/dto/server-error.dto';

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
    const apiRecord = await this.returnManager().findOne(
      Api,
      request.headers['x-client-id'],
    );

    this.logger.info(errorDto.errorMessage, {
      appName: apiRecord.name,
      ...errorDto.metadata,
    });
  }
}
