import { getManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common/exceptions';

import { ReportDTO } from '../dto/report.dto';
import { DataSetRepository } from './dataset.repository';
import { ReportParamsDTO } from '../dto/report-params.dto';
import { DataSet } from '../entities/dataset.entity';
import { DataTable } from '../entities/datatable.entity';
import { ReportDetailDTO } from '../dto/report-detail.dto';
import { ReportColumnDTO } from '../dto/report-column.dto';

@Injectable()
export class DataSetService {
  private hasFacilityInfo: boolean;
  private reportColumns: ReportColumnDTO[];

  constructor(
    @InjectRepository(DataSetRepository)
    private readonly repository: DataSetRepository,
  ) {}

  async getAvailableDataSets(isWorkspace: boolean = false) {
    const results = await this.repository.find({
      where: { groupCode: 'REPORT' },
    });

    return results.map((e) => {
      return {
        code: e.code,
        name: e.displayName,
      };
    });
  }

  async getTestDataSet(
    schema: string,
    dataSet: DataSet,
    params: ReportParamsDTO,
    test: { id: string; code: string },
  ): Promise<ReportDetailDTO[]> {
    const detailDef = dataSet.tables.filter(tbl =>
        tbl.template.groupCode === 'ALL' ||
        tbl.template.groupCode === test.code,
    );

    return this.getDataSetResults(
      schema,
      detailDef,
      params,
      test.id,
    );    
  }

  async getDataSet(
    params: ReportParamsDTO,
    isWorkspace: boolean = false
  ) {
    this.reportColumns = [];
    this.hasFacilityInfo = false;
    const report = new ReportDTO();
    const schema = isWorkspace ? 'camdecmpswks' : 'camdecmps';
    const dataSet = await this.repository.getDataSet(params.reportCode);

    if (!dataSet) {
      throw new BadRequestException('Invalid report code');
    }

    report.displayName = dataSet.displayName;

    if (params.reportCode === 'TEST_DETAIL') {
      const promises = [];
      const tests = await getManager().query(`
        SELECT
          test_sum_id AS "id",
          test_type_cd AS  "code"
        FROM ${schema}.test_summary
        WHERE test_sum_id = ANY($1);`,
        [params.testId],
      );

      tests.forEach((test: { id: string; code: string }) => {
        promises.push(this.getTestDataSet(schema, dataSet, params, test));
      });

      await Promise.all(promises);

      report.details = [];
      for (const details of promises) {
        report.details.push(...(await details));
      }
    } else {
      report.details = await this.getDataSetResults(
        schema,
        dataSet.tables,
        params,
      );
    }

    report.columns = this.reportColumns;
    report.details = report.details.filter(
      (detail) => detail.results.length > 0,
    );

    return report;
  }

  async getDataSetResult(
    schema: string,
    table: DataTable,
    params: ReportParamsDTO,
    testId?: string,
  ): Promise<ReportDetailDTO> {
    table.sqlStatement = table.sqlStatement.replace(
      /{SCHEMA}/,
      schema,
    );

    const sqlParams = table.parameters.map((param) => {
      if (params.reportCode.includes('EVAL')) {
        if (param.name === 'testId')
          return params.testId[0];
        if (param.name === 'qceId')
          return params.qceId[0];
        if (param.name === 'teeId')
          return params.teeId[0];
      } else if (param.name === 'testId') {
        if (params.testId.length === 1)
          return params.testId[0];
        else return testId;
      }
      return params[param.name] ?? param.defaultValue;
    });

    const detailDto = new ReportDetailDTO();
    detailDto.displayName = table.displayName
      ? table.displayName
      : table.template.displayName;
    detailDto.templateCode = table.template.code;
    detailDto.templateType = table.template.type;
    detailDto.results = await getManager().query(
      table.sqlStatement, sqlParams
    );

    if (detailDto.results.length > 0) {
      let columnDto = this.reportColumns.find(column =>
        column.code === table.templateCode
      );

      if (!columnDto) {
        columnDto = new ReportColumnDTO();
        columnDto.code = table.templateCode;
        columnDto.values = table.columns.map(column => {
          return {
            name: column.name,
            displayName: column.displayName,
          };
        });
        this.reportColumns.push(columnDto);
      }
    }

    return detailDto;
  }

  async getDataSetResults(
    schema: string,
    tables: DataTable[],
    params: ReportParamsDTO,
    testId?: string,
  ): Promise<ReportDetailDTO[]> {
    const promises = [];
    const FACINFO = 'FACINFO';

    tables.forEach(tbl => {
      if (!this.hasFacilityInfo || !tbl.templateCode.includes(FACINFO)) {
        promises.push(this.getDataSetResult(schema, tbl, params, testId));
        if (!this.hasFacilityInfo && tbl.templateCode.includes(FACINFO)) {
          this.hasFacilityInfo = true;
        }
      }
    });

    return Promise.all(promises);
  }
}
