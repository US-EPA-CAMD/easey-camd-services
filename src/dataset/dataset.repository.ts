import { EntityManager, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { DataSet } from '../entities/dataset.entity';

@Injectable()
export class DataSetRepository extends Repository<DataSet> {
  constructor(entityManager: EntityManager) {
    super(DataSet, entityManager);
  }

  async getDataSet(dataSetCode: string): Promise<DataSet> {
    return this.createQueryBuilder('ds')
      .innerJoinAndSelect('ds.tables', 'tbl')
      .innerJoinAndSelect('tbl.columns', 'c')
      .innerJoinAndSelect('tbl.parameters', 'p')
      .innerJoinAndSelect('tbl.template', 't')
      .where('ds.code = :dataSetCode', { dataSetCode })
      .orderBy('t.groupCode, tbl.tableOrder, c.columnOrder, p.parameterOrder')
      .getOne();
  }

  async query(query: string, params: any[]): Promise<any[]> {
    return this.query(query, params);
  }
}
