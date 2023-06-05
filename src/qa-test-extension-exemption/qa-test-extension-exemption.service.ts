import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { QaTeeMaintView } from '../entities/qa-tee-maint-vw.entity';

@Injectable()
export class QaTestExtensionExemptionService {

    constructor(
        @InjectEntityManager()
        private readonly manager: EntityManager
    ) { }

    getQaTeeViewData(orisCode: number, unitStack: string): Promise<QaTeeMaintView[]> {
        const where = {
            orisCode
        } as any;

        if (unitStack !== null && unitStack !== undefined)
            where.unitStack = unitStack;

        return this.manager.find(QaTeeMaintView, {
            where
        })
    }
}
