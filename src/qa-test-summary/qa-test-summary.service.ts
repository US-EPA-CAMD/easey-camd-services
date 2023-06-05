import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { QaTestSummaryMaintView } from '../entities/qa-test-summary-maint-vw.entity';
import { InjectEntityManager } from '@nestjs/typeorm';

@Injectable()
export class QaTestSummaryService {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,
  ) {}

  async getQaTestSummaryViewData(
    orisCode: number,
    unitStack: string,
  ): Promise<QaTestSummaryMaintView[]> {
    const where = {
      orisCode,
    } as any;

    if (unitStack !== null && unitStack !== undefined)
      where.unitStack = unitStack;

    return this.manager.find(QaTestSummaryMaintView, {
      where,
    });
  }
}
