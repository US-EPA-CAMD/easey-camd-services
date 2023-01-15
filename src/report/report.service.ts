import { getManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ReportDTO } from './../dto/report.dto';
import { ReportRepository } from './report.repository';
import { ReportParamsDTO } from './../dto/report-params.dto';
import { ReportDetail } from './../entities/report-detail.entity';
import { ReportDetailDTO } from './../dto/report-detail.dto';
import { ReportColumnDTO } from './../dto/report-column.dto';

@Injectable()
export class ReportService {
  private hasFacilityInfo: boolean;
  private reportColumns: ReportColumnDTO[];

  constructor(
    @InjectRepository(ReportRepository)
    private readonly repository: ReportRepository,
  ) {}

  async getReport(
    params: ReportParamsDTO, 
    isWorkspace: boolean = false
  ) {
    this.reportColumns = [];
    this.hasFacilityInfo = false;
    const report = new ReportDTO();
    const schema = isWorkspace ? 'camdecmpswks' : 'camdecmps';
    const reportDef = await this.repository.getReportDefinition(params.reportCode);
    report.displayName = reportDef.displayName;

    if (params.testId && params.testId.length > 0) {
      const promises = [];
      const tests = await getManager().query(`
        SELECT
          test_sum_id AS "id",
          test_type_cd AS  "code"
        FROM ${schema}.test_summary
        WHERE test_sum_id = ANY($1);`,
        [params.testId]
      );

      tests.forEach((test: { id: string, code: string }) => {
        promises.push(
          new Promise((resolve, _reject) => {
            const detailDef = reportDef.details.filter(detail => 
              detail.template.groupCode === "ALL" ||
              detail.template.groupCode === test.code
            );
            const details = this.getReportResults(
              schema,
              detailDef,
              params,
              test.id,
            );
            resolve(details);
          })
        );
      });

      await Promise.all(promises);

      report.details = [];
      for (const details of promises) {
        report.details.push(...await details);
      }
    } else {
      report.details = await this.getReportResults(
        schema,
        reportDef.details,
        params,
      );
    }

    report.columns = this.reportColumns;
    report.details = report.details.filter(
      detail => detail.results.length > 0
    );

    return report;
  }

  async getReportResults(
    schema: string,
    details: ReportDetail[],
    params: ReportParamsDTO,
    testId?: string,
  ): Promise<ReportDetailDTO[]> {
    const promises = [];
    const FACINFO = 'FACINFO';

    details.forEach(detail => {
      if (!this.hasFacilityInfo || detail.templateCode !== FACINFO) {
        promises.push(
          new Promise(async (resolve, _reject) => {
            detail.sqlStatement = detail.sqlStatement.replace(
              /{SCHEMA}/,
              schema,
            );

            const sqlParams = detail.parameters.map((param) => {
              if (param.name === 'testId') {
                return testId;
              }
              return params[param.name] ?? param.defaultValue;
            });

            const detailDto = new ReportDetailDTO();
            detailDto.displayName = detail.displayName
              ? detail.displayName
              : detail.template.displayName;
            detailDto.templateCode = detail.template.code;
            detailDto.templateType = detail.template.type;
            console.log(detail.sqlStatement, sqlParams);
            detailDto.results = await getManager().query(detail.sqlStatement, sqlParams);

            if (detailDto.results.length > 0) {
              let columnDto = this.reportColumns.find(column =>
                column.code === detail.templateCode
              );

              if (!columnDto) {
                columnDto = new ReportColumnDTO();
                columnDto.code = detail.templateCode;
                columnDto.values = detail.columns.map(column => {
                  return {
                    name: column.name,
                    displayName: column.displayName,
                  };
                });
                this.reportColumns.push(columnDto);
              }
            }

            resolve(detailDto);
          })
        );
        if (!this.hasFacilityInfo && detail.templateCode === FACINFO) {
          this.hasFacilityInfo = true;
        }
      }
    });

    return Promise.all(promises);
  }
}
