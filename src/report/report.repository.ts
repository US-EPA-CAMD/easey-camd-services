import { EntityRepository, Repository } from 'typeorm';
import { Report } from '../entities/report.entity';

@EntityRepository(Report)
export class ReportRepository extends Repository<Report> {
  async getReport(reportCode: string) {
    return this.createQueryBuilder('r')
      .innerJoinAndSelect('r.details', 'rd')
      .innerJoinAndSelect('rd.columns', 'c')
      .innerJoinAndSelect('rd.parameters', 'p')
      .where('r.code = :reportCode', { reportCode })
      .orderBy('rd.sequenceNumber, c.sequenceNumber, p.sequenceNumber')
      .getOne();
  }
}
