import { Injectable } from '@nestjs/common';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { JobLog } from '../entities/job-log.entity';
import { StateCode } from '../entities/state-code.entity';
import { getManager } from 'typeorm';
import {
  ApportionedEmissionsQuarterlyDTO,
  ApportionedEmissionsStateDTO,
  ProgramCodeDTO,
  TimePeriodDTO,
} from '../dto/bulk-file-mass-generation.dto';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { ProgramCode } from '../entities/program-code.entity';

interface QuarterDates {
  beginDate: string;
  endDate: string;
}

@Injectable()
export class MassBulkFileService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  returnManager(): any {
    return getManager();
  }

  async getStateCodes(stateCodes: string[]) {
    if (stateCodes.length === 0 || stateCodes[0] === '*') {
      // Return all of the state codes

      return (await this.returnManager().find(StateCode)).map(
        (item) => item.stateCode,
      );
    }
    return stateCodes;
  }

  async getProgramCodes(programCodes: string[]) {
    if (programCodes.length === 0 || programCodes[0] === '*') {
      // Return all of the state codes
      return (
        await this.returnManager().find(ProgramCode, { where: { active: 1 } })
      ).map((item) => item.prgCode);
    }
    return programCodes;
  }

  getQuarterList(quarters: number[]): number[] {
    if (quarters.length === 0) {
      return [1, 2, 3, 4];
    }

    return quarters;
  }

  getQuarterDates(quarter, year) {
    const qd: QuarterDates = { beginDate: '', endDate: '' };

    if (quarter == 1) {
      qd.beginDate = year + '-01-01';
      qd.endDate = year + '-03-31';
    } else if (quarter == 2) {
      qd.beginDate = year + '-04-01';
      qd.endDate = year + '-06-30';
    } else if (quarter == 3) {
      qd.beginDate = year + '-07-01';
      qd.endDate = year + '-09-30';
    } else {
      qd.beginDate = year + '-10-01';
      qd.endDate = year + '-12-31';
    }

    return qd;
  }

  createBasicJobLog(jobName: string) {
    const jobLog = new JobLog();
    jobLog.jobIdentifier = uuidv4();
    jobLog.jobName = jobName;
    return jobLog;
  }

  async generateStateApportionedEmissions(
    params: ApportionedEmissionsStateDTO,
  ): Promise<void> {
    const promises = [];
    const stateCodes = await this.getStateCodes(params.stateCodes);

    for (
      let currentYear = params.from;
      currentYear <= params.to;
      currentYear++
    ) {
      for (const stateCd of stateCodes) {
        for (const subType of params.subTypes) {
          const urlParams = `beginDate=${currentYear}-01-01&endDate=${currentYear}-12-31&stateCode=${stateCd}`;

          promises.push(
            new Promise(async (resolve) => {
              const jobLog = this.createBasicJobLog(
                `${subType}-Apportioned-Emissions-${stateCd}-${currentYear}`,
              );
              jobLog.year = currentYear;
              jobLog.stateCode = stateCd;
              jobLog.dataType = 'Emissions';
              jobLog.subType = subType;
              jobLog.url = `${this.configService.get<string>(
                'app.streamingApiUrl',
              )}/emissions/apportioned/${subType.toLowerCase()}?${urlParams}`;
              jobLog.fileName = `emissions/${subType.toLowerCase()}/state/emissions-${subType.toLowerCase()}-${currentYear}-${stateCd.toLowerCase()}.csv`;

              await this.returnManager().insert(JobLog, jobLog);
              resolve(true);
            }),
          );

          if (
            params.generateStateMATS &&
            currentYear >= 2015 &&
            subType === 'Hourly'
          ) {
            promises.push(
              new Promise(async (resolve) => {
                const jobLog = this.createBasicJobLog(
                  `${subType}-MATS-${stateCd}-${currentYear}`,
                );
                jobLog.dataType = 'Mercury and Air Toxics Emissions (MATS)';
                jobLog.year = currentYear;
                jobLog.stateCode = stateCd;
                jobLog.subType = subType;
                jobLog.url = `${this.configService.get<string>(
                  'app.streamingApiUrl',
                )}/emissions/apportioned/mats/hourly?${urlParams}`;
                jobLog.fileName = `mats/hourly/state/mats-hourly-${currentYear}-${stateCd.toLowerCase()}.csv`;

                await this.returnManager().insert(JobLog, jobLog);
                resolve(true);
              }),
            );
          }
        }
      }
    }

    await Promise.all(promises);
  }

  async generateQuarterApportionedEmissions(
    params: ApportionedEmissionsQuarterlyDTO,
  ): Promise<void> {
    const promises = [];
    const quarters = this.getQuarterList(params.quarters);

    for (
      let currentYear = params.from;
      currentYear <= params.to;
      currentYear++
    ) {
      for (const quarter of quarters) {
        const quarterDate: QuarterDates = this.getQuarterDates(
          quarter,
          currentYear,
        );
        const urlParams = `beginDate=${quarterDate.beginDate}&endDate=${quarterDate.endDate}`;

        for (const subType of params.subTypes) {
          promises.push(
            new Promise(async (resolve) => {
              const jobLog = this.createBasicJobLog(
                `${subType}-Apportioned-Emissions-Q${quarter}-${currentYear}`,
              );
              jobLog.year = currentYear;
              jobLog.quarter = quarter;
              jobLog.subType = subType;
              jobLog.dataType = 'Emissions';
              jobLog.url = `${this.configService.get<string>(
                'app.streamingApiUrl',
              )}/emissions/apportioned/${subType.toLowerCase()}?${urlParams}`;
              jobLog.fileName = `emissions/${subType.toLowerCase()}/quarter/emissions-${subType.toLowerCase()}-${currentYear}-q${quarter}.csv`;

              await this.returnManager().insert(JobLog, jobLog);
              resolve(true);
            }),
          );

          if (
            params.generateQuarterMATS &&
            currentYear >= 2015 &&
            subType === 'Hourly'
          ) {
            promises.push(
              new Promise(async (resolve) => {
                const jobLog = this.createBasicJobLog(
                  `${subType}-MATS-Q${quarter}-${currentYear}`,
                );
                jobLog.year = currentYear;
                jobLog.quarter = quarter;
                jobLog.subType = subType;
                jobLog.dataType = 'Mercury and Air Toxics Emissions (MATS)';
                jobLog.url = `${this.configService.get<string>(
                  'app.streamingApiUrl',
                )}/emissions/apportioned/mats/hourly?${urlParams}`;
                jobLog.fileName = `mats/hourly/quarter/mats-hourly-${currentYear}-q${quarter}.csv`;

                await this.returnManager().insert(JobLog, jobLog);
                resolve(true);
              }),
            );
          }
        }
      }
    }

    await Promise.all(promises);
  }

  async generateFacility(params: TimePeriodDTO): Promise<void> {
    for (
      let currentYear = params.from;
      currentYear <= params.to;
      currentYear++
    ) {
      const jobLog = this.createBasicJobLog(`Facility-${currentYear}`);
      jobLog.dataType = 'Facility';
      jobLog.year = currentYear;
      jobLog.url = `${this.configService.get<string>(
        'app.streamingApiUrl',
      )}/facilities/attributes?year=${currentYear}`;
      jobLog.fileName = `facility/facility-${currentYear}.csv`;
      await this.returnManager().insert(JobLog, jobLog);
    }
  }

  async generateEmissionsCompliance(): Promise<void> {
    const jobLog = this.createBasicJobLog(`Emissions-Compliance-ARPNOX`);
    jobLog.url = `${this.configService.get<string>(
      'app.streamingApiUrl',
    )}/emissions-compliance`;
    jobLog.dataType = 'Compliance';
    jobLog.fileName = `compliance/compliance-arpnox.csv`;
    jobLog.programCode = 'ARP';
    await this.returnManager().insert(JobLog, jobLog);
  }

  async generateAllowanceHoldings(params: ProgramCodeDTO): Promise<void> {
    const programCodes = await this.getProgramCodes(params.programCodes);

    for (const cd of programCodes) {
      const urlParams = `programCodeInfo=${cd}`;

      const jobLog = this.createBasicJobLog(`Allowance-Holdings-${cd}`);
      jobLog.url = `${this.configService.get<string>(
        'app.streamingApiUrl',
      )}/allowance-holdings?${urlParams}`;

      jobLog.dataType = 'Allowance';
      jobLog.fileName = `allowance/holdings-${cd.toLowerCase()}.csv`;
      jobLog.programCode = cd;
      await this.returnManager().insert(JobLog, jobLog);
    }
  }

  async generateAllowanceCompliance(params: ProgramCodeDTO): Promise<void> {
    const programCodes = await this.getProgramCodes(params.programCodes);

    for (const cd of programCodes) {
      const urlParams = `programCodeInfo=${cd}`;

      const jobLog = this.createBasicJobLog(`Allowance-Compliance-${cd}`);
      jobLog.dataType = 'Compliance';
      jobLog.url = `${this.configService.get<string>(
        'app.streamingApiUrl',
      )}/allowance-compliance?${urlParams}`;

      jobLog.fileName = `compliance/compliance-${cd.toLowerCase()}.csv`;
      jobLog.programCode = cd;
      await this.returnManager().insert(JobLog, jobLog);
    }
  }

  async generateAllowanceTransactions(params: ProgramCodeDTO): Promise<void> {
    const programCodes = await this.getProgramCodes(params.programCodes);
    const year = new Date().getUTCFullYear() - 1;

    for (const cd of programCodes) {
      const urlParams = `transactionBeginDate=1993-03-23&transactionEndDate=${year}-12-31&programCodeInfo=${cd}`;

      const jobLog = this.createBasicJobLog(`Allowance-Transactions-${cd}`);
      jobLog.dataType = 'Allowance';
      jobLog.url = `${this.configService.get<string>(
        'app.streamingApiUrl',
      )}/allowance-transactions?${urlParams}`;

      jobLog.fileName = `allowance/transactions-${cd.toLowerCase()}.csv`;
      jobLog.programCode = cd;
      jobLog.year = year;
      await this.returnManager().insert(JobLog, jobLog);
    }
  }
}
