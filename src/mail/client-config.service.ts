import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { ClientConfig } from '../entities/client-config.entity';

@Injectable()
export class ClientConfigService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly logger: Logger,
  ) {}
  
  async getClientConfigById(clientId: string): Promise<ClientConfig> {
    const clientConfig = await this.entityManager.findOneBy(ClientConfig, {
      id: clientId,
    });

    if (!clientConfig) {
      throw new Error(`ClientConfig ${clientId} not found`);
    }

    return clientConfig;
  }

  async getECMPSClientConfig(): Promise<ClientConfig> {
    return await this.entityManager.findOne(ClientConfig, {
      where: { name: 'ecmps-ui' },
    });
  }
}