import { getManager } from 'typeorm';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';

import { ReportMap } from './../maps/report.map';
import { ReportRepository } from './report.repository';
import { ReportParamsDTO } from './../dto/report-params.dto';

@Injectable()
export class ReportService {
  constructor(
    private readonly logger: Logger,
    private readonly map: ReportMap,
    @InjectRepository(ReportRepository)
    private readonly repository: ReportRepository,
  ) {}

  returnManager(): any {
    return getManager();
  }

  async getReport(params: ReportParamsDTO) {
    let plant = null;
    const promises = [];
    const mgr = this.returnManager();
    const report = await this.map.one(
      await this.repository.getReport(params.reportCode),
    );
    const schema = params.workspace ? 'camdecmpswks' : 'camdecmps';

    if (params.monitorPlanId) {
      const locations = await mgr.query(
        `
        SELECT
          p.fac_id AS "facilityId",
          p.oris_code AS "orisCode",
          p.facility_name AS "facilityName",
          p.state AS "stateCode",
          cc.county_name AS "countyName",
          CASE
            WHEN u.unitId IS NULL THEN sp.stack_name
            ELSE u.unitId
          END AS "unitStack"
        FROM ${schema}.monitor_location ml
        JOIN ${schema}.monitor_plan_location mpl USING(mon_loc_id)
        JOIN ${schema}.monitor_plan mp USING(mon_plan_id)
        JOIN camd.plant p USING(fac_id)
        JOIN camdmd.county_code cc USING(county_cd)
        LEFT JOIN camd.unit u USING(unit_id)
        LEFT JOIN ${schema}.stack_pipe sp USING(stack_pipe_id)
        WHERE mp.mon_plan_id = $1
        ORDER BY u.unitId, sp.stack_name`,
        [params.monitorPlanId],
      );

      plant = locations[0];
      report.unitStackInfo = locations.map((i) => i.unitStack).join(', ');
    } else if (params.facilityId) {
      plant = await mgr.query(
        `
        SELECT
          p.fac_id AS "facilityId",
          p.oris_code AS "orisCode",
          p.facility_name AS "facilityName",
          p.state AS "stateCode",
          cc.county_name AS "countyName"
        FROM camd.plant p
        JOIN camdmd.county_code cc USING(county_cd)
        WHERE p.fac_id = $1`,
        [params.facilityId],
      );
    }

    report.orisCode = plant.orisCode;
    report.stateCode = plant.stateCode;
    report.countyName = plant.countyName;
    report.facilityId = plant.facilityId;
    report.facilityName = plant.facilityName;

    report.details.forEach((detail) => {
      promises.push(
        new Promise(async (resolve, _reject) => {
          const sqlParams = detail.parameters.map(
            (param) => params[param.name] ?? param.defaultValue,
          );
          detail.sqlStatement = detail.sqlStatement.replace(
            /camdecmpswks/,
            schema,
          );
          const results = mgr.query(detail.sqlStatement, sqlParams);
          resolve(results);
        }),
      );
    });

    await Promise.all(promises);

    for (let i = 0; i < promises.length; i++) {
      report.details[i].results = await promises[i];
    }

    return report;
  }
}
