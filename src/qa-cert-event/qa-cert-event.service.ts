import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { QaCertEventMaintView } from '../entities/qa-cert-event-maint-vw.entity';

@Injectable()
export class QaCertEventService {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,
  ) {}

  getQaCertEventViewData(
    orisCode: number,
    unitStack: string,
  ): Promise<QaCertEventMaintView[]> {
    const where = {
      orisCode,
    } as any;

    if (unitStack !== null && unitStack !== undefined)
      where.unitStack = unitStack;

    return this.manager.find(QaCertEventMaintView, {
      where,
    });
  }
}
