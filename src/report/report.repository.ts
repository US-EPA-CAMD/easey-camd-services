import { EntityRepository, Repository } from 'typeorm';
import { Report } from '../entities/report.entity';

@EntityRepository(Report)
export class ReportRepository extends Repository<Report> {
  async getReport(reportCode: string) {
    const templateCodes = ['SUMRPT', 'DTLRPT'];
    return this.createQueryBuilder('r')
      .innerJoinAndSelect('r.details', 'rd')
      .innerJoinAndSelect('rd.columns', 'c')
      .innerJoinAndSelect('rd.parameters', 'p')
      .where('r.templateCode IN (:...templateCodes)', { templateCodes })
      .andWhere('r.code = :reportCode', { reportCode })
      .orderBy('rd.detailOrder, c.columnOrder, p.parameterOrder')
      .getOne();
  }
}
