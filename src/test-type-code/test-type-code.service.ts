import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { TestTypeCode } from '../entities/test-type-code.entity';

@Injectable()
export class TestTypeCodeService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async findAll(): Promise<TestTypeCode[]> {
    return await this.entityManager.find(TestTypeCode);
  }
}