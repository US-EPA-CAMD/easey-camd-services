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
  private apiUrl: string;
  private parentId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.parentId = uuidv4();
    this.apiUrl = configService.get<string>('app.streamingApiUrl');
  }

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

  newJobLog(jobName: string) {
    const jobLog = new JobLog();
    jobLog.jobIdentifier = uuidv4();
    jobLog.parentJobIdentifier = this.parentId;
    jobLog.jobName = jobName;
    return jobLog;
  }

  async createJobLog(jobName: string, dataType: string, subType: string, stateCd: string, currentYear: number, quarter: number, prgCode: string, url: string, filename: string) {
    const jobLog = this.newJobLog(jobName);
    jobLog.year = currentYear;
    jobLog.quarter = quarter;
    jobLog.programCode = prgCode,
    jobLog.stateCode = stateCd;
    jobLog.dataType = dataType;
    jobLog.subType = subType;
    jobLog.url = `${this.apiUrl}/${url}`;
    jobLog.fileName = filename;
    await this.returnManager().insert(JobLog, jobLog);
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

          promises.push(this.createJobLog(
            `${subType}-Apportioned-Emissions-${stateCd}-${currentYear}`,
            'Emissions',
            subType,
            stateCd,
            currentYear,
            null,
            null,
            `emissions/apportioned/${subType.toLowerCase()}?${urlParams}`,
            `emissions/${subType.toLowerCase()}/state/emissions-${subType.toLowerCase()}-${currentYear}-${stateCd.toLowerCase()}.csv`
          ));

          if (
            params.generateStateMATS &&
            currentYear >= 2015 &&
            subType === 'Hourly'
          ) {
            promises.push(this.createJobLog(
              `${subType}-MATS-${stateCd}-${currentYear}`,
              'Mercury and Air Toxics Emissions (MATS)',
              subType,
              stateCd,
              currentYear,
              null,
              null,
              `emissions/apportioned/mats/hourly?${urlParams}`,
              `mats/hourly/state/mats-hourly-${currentYear}-${stateCd.toLowerCase()}.csv`
            ));
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
          promises.push(this.createJobLog(
            `${subType}-Apportioned-Emissions-Q${quarter}-${currentYear}`,
            'Emissions',
            subType,
            null,
            currentYear,
            quarter,
            null,
            `emissions/apportioned/${subType.toLowerCase()}?${urlParams}`,
            `emissions/${subType.toLowerCase()}/quarter/emissions-${subType.toLowerCase()}-${currentYear}-q${quarter}.csv`
          ));

          if (
            params.generateQuarterMATS &&
            currentYear >= 2015 &&
            subType === 'Hourly'
          ) {
            promises.push(this.createJobLog(
              `${subType}-MATS-Q${quarter}-${currentYear}`,
              'Mercury and Air Toxics Emissions (MATS)',
              subType,
              null,
              currentYear,
              quarter,
              null,
              `emissions/apportioned/mats/hourly?${urlParams}`,
              `mats/hourly/quarter/mats-hourly-${currentYear}-q${quarter}.csv`
            ));
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
      await this.createJobLog(
        `Facility-${currentYear}`,
        'Facility',
        null,
        null,
        currentYear,
        null,
        null,
        `facilities/attributes?year=${currentYear}`,
        `facility/facility-${currentYear}.csv`
      );
    }
  }

  async generateEmissionsCompliance(): Promise<void> {
    await this.createJobLog(
      `Emissions-Compliance-ARPNOX`,
      'Compliance',
      null,
      null,
      null,
      null,
      'ARP',
      `emissions-compliance`,
      `compliance/compliance-arpnox.csv`
    );
  }

  async generateAllowanceHoldings(params: ProgramCodeDTO): Promise<void> {
    const programCodes = await this.getProgramCodes(params.programCodes);

    for (const cd of programCodes) {
      const urlParams = `programCodeInfo=${cd}`;
      await this.createJobLog(
        `Allowance-Holdings-${cd}`,
        'Allowance',
        null,
        null,
        null,
        null,
        cd,
        `allowance-holdings?${urlParams}`,
        `allowance/holdings-${cd.toLowerCase()}.csv`
      );
    }
  }

  async generateAllowanceCompliance(params: ProgramCodeDTO): Promise<void> {
    const programCodes = await this.getProgramCodes(params.programCodes);

    for (const cd of programCodes) {
      const urlParams = `programCodeInfo=${cd}`;
      await this.createJobLog(
        `Allowance-Compliance-${cd}`,
        'Compliance',
        null,
        null,
        null,
        null,
        cd,
        `allowance-compliance?${urlParams}`,
        `compliance/compliance-${cd.toLowerCase()}.csv`
      );
    }
  }

  async generateAllowanceTransactions(params: ProgramCodeDTO): Promise<void> {
    const programCodes = await this.getProgramCodes(params.programCodes);
    const year = new Date().getUTCFullYear() - 1;

    for (const cd of programCodes) {
      const urlParams = `transactionBeginDate=1993-03-23&transactionEndDate=${year}-12-31&programCodeInfo=${cd}`;
      await this.createJobLog(
        `Allowance-Transactions-${cd}`,
        'Allowance',
        null,
        null,
        null,
        null,
        cd,
        `allowance-transactions?${urlParams}`,
        `allowance/transactions-${cd.toLowerCase()}.csv`
      );
    }
  }
}
