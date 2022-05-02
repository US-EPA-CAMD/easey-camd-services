import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@us-epa-camd/easey-common/logger';

@Injectable()
export class BookmarkService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) { }
}
