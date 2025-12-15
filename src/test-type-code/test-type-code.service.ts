import { Injectable } from '@nestjs/common';
import { EntityManager, DataSource } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { withSlaveConnection } from '@us-epa-camd/easey-common/connection';
import { TestTypeCode } from '../entities/test-type-code.entity';

@Injectable()
export class TestTypeCodeService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<TestTypeCode[]> {
    return withSlaveConnection(this.dataSource, async (manager) => {
      return await manager.find(TestTypeCode);
    });
  }
}