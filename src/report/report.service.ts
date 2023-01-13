import { getManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ReportDTO } from './../dto/report.dto';
import { ReportRepository } from './report.repository';
import { ReportParamsDTO } from './../dto/report-params.dto';
import { ReportDetail } from './../entities/report-detail.entity';
import { ReportDetailDTO } from './../dto/report-detail.dto';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(ReportRepository)
    private readonly repository: ReportRepository,
  ) {}

  // returnManager() {
  //   return getManager();
  // }

  async getReport(
    params: ReportParamsDTO, 
    isWorkspace: boolean = false
  ) {
    params.testId = [
      'DPGLISSO9-CE60EAA7A9CC4487ACFD6B438128997E',
      'DPGLISSO11-5725CD43C44148F9A28C07A05812983C'
    ]

    const promises = [];
    const reportDto = new ReportDTO();
    const schema = isWorkspace ? 'camdecmpswks' : 'camdecmps';
    const report = await this.repository.getReport(params.reportCode);

    reportDto.displayName = report.displayName;
    reportDto.details = [];    

    const tests = await getManager().query(`
      SELECT
        test_sum_id AS "testId",
        test_type_cd AS  "groupCode"
      FROM ${schema}.test_summary
      WHERE test_sum_id = ANY($1);`,
      [params.testId]
    );

    tests.forEach((test: { testId: string, groupCode: string }) => {
      promises.push(
        new Promise(async (resolve, _reject) => {
          const details = report.details.filter(detail => 
            detail.template.groupCode === test.groupCode
          );
          const results = await this.getReportDetails(
            params,
            details,
            schema
          );
          resolve(results);
        })
      );
    });

    await Promise.all(promises);

    for (const promise of promises) {
      reportDto.details.push(...await promise);
    }

    // if (params.monitorPlanId) {
    //   const locations = await getManager().query(`
    //     SELECT
    //       p.fac_id AS "facilityId",
    //       p.oris_code AS "orisCode",
    //       p.facility_name AS "facilityName",
    //       p.state AS "stateCode",
    //       cc.county_name AS "countyName",
    //       CASE
    //         WHEN u.unitId IS NULL THEN sp.stack_name
    //         ELSE u.unitId
    //       END AS "unitStack"
    //     FROM ${schema}.monitor_location ml
    //     JOIN ${schema}.monitor_plan_location mpl USING(mon_loc_id)
    //     JOIN ${schema}.monitor_plan mp USING(mon_plan_id)
    //     JOIN camd.plant p USING(fac_id)
    //     JOIN camdmd.county_code cc USING(county_cd)
    //     LEFT JOIN camd.unit u USING(unit_id)
    //     LEFT JOIN ${schema}.stack_pipe sp USING(stack_pipe_id)
    //     WHERE mp.mon_plan_id = $1
    //     ORDER BY u.unitId, sp.stack_name`,
    //     [params.monitorPlanId],
    //   );

    //   plant = locations[0];
    //   report.unitStackInfo = locations.map((i) => i.unitStack).join(', ');
    // } else if (params.facilityId) {
    //   plant = await getManager().query(`
    //     SELECT
    //       p.fac_id AS "facilityId",
    //       p.oris_code AS "orisCode",
    //       p.facility_name AS "facilityName",
    //       p.state AS "stateCode",
    //       cc.county_name AS "countyName"
    //     FROM camd.plant p
    //     JOIN camdmd.county_code cc USING(county_cd)
    //     WHERE p.fac_id = $1`,
    //     [params.facilityId],
    //   );
    // }

    // report.orisCode = plant.orisCode;
    // report.stateCode = plant.stateCode;
    // report.countyName = plant.countyName;
    // report.facilityId = plant.facilityId;
    // report.facilityName = plant.facilityName;

    //const details = await this.repository.getReportDetails(params.reportCode);
    //await this.getReportDetails(params, details, schema);

    // report.details.forEach((detail) => {
    //   promises.push(
    //     new Promise(async (resolve, _reject) => {
    //       const sqlParams = detail.parameters.map(
    //         (param) => params[param.name] ?? param.defaultValue,
    //       );
    //       detail.sqlStatement = detail.sqlStatement.replace(
    //         /{SCHEMA}/,
    //         schema,
    //       );
    //       const results = getManager().query(detail.sqlStatement, sqlParams);
    //       delete detail.sqlStatement;
    //       delete detail.parameters;
    //       resolve(results);
    //     })
    //   );
    // });

    // await Promise.all(promises);

    // for (let i = 0; i < promises.length; i++) {
    //   report.details[i].results = await promises[i];
    // }

    return reportDto;
  }

  async getReportDetails(
    params: ReportParamsDTO,
    details: ReportDetail[],
    schema: string,
  ): Promise<ReportDetailDTO[]> {
    const promises = [];

    details.forEach(detail => {
      promises.push(
        new Promise(async (resolve, _reject) => {
          const sqlParams = detail.parameters.map(
            (param) => params[param.name] ?? param.defaultValue,
          );
          detail.sqlStatement = detail.sqlStatement.replace(
            /{SCHEMA}/,
            schema,
          );
          const results = await getManager().query(detail.sqlStatement, sqlParams);
          const detailDto = new ReportDetailDTO();
          detailDto.displayName = detail.displayName
            ? detail.displayName
            : detail.template.displayName;
          detailDto.templateCode = detail.template.code;          
          detailDto.templateType = detail.template.type;
          detailDto.results = results;
          resolve(detailDto);
        })
      );
    });

    return Promise.all(promises);
  }
}
