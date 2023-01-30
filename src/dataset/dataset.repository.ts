import { EntityRepository, Repository } from 'typeorm';
import { DataSet } from '../entities/dataset.entity';

@EntityRepository(DataSet)
export class DataSetRepository extends Repository<DataSet> {

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
