import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { Evaluation } from '../entities/evaluation.entity';
import { EvaluationSet } from '../entities/evaluation-set.entity';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { Plant } from '../entities/plant.entity';
import { TestSummary } from '../entities/test-summary.entity';
import { MonitorSystem } from '../entities/monitor-system.entity';
import { Component } from '../entities/component.entity';
import { CountyCode } from '../entities/county-code.entity';
import { QaCertEvent } from '../entities/qa-cert-event.entity';
import { QaTee } from '../entities/qa-tee.entity';
import { ReportingPeriod } from '../entities/reporting-period.entity';
import { EmissionEvaluation } from '../entities/emission-evaluation.entity';
import { ConfigService } from '@nestjs/config';
import { SubmissionQueue } from '../entities/submission-queue.entity';
import { SubmissionSet } from '../entities/submission-set.entity';
import { MatsBulkFile } from '../entities/mats-bulk-file.entity';
import { MonitorPlanGlobal } from '../entities/monitor-plan-global.entity';
import { TestSummaryGlobal } from '../entities/test-summary-global.entity';
import { QaCertEventGlobal } from '../entities/qa-cert-event-global.entity';
import { QaTeeGlobal } from '../entities/qa-tee-global.entity';
import { EmissionEvaluationGlobal } from '../entities/emission-evaluation-global.entity';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';
import { ReportParamsDTO } from '../dto/report-params.dto';
import { DataSetService } from '../dataset/dataset.service';
import { CopyOfRecordService } from '../copy-of-record/copy-of-record.service';
import { SeverityCode } from '../entities/severity-code.entity';

//Formats and sends emissions evaluations emails
@Injectable()
export class MailEvalService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private dataSetService: DataSetService,
    private copyOfRecordService: CopyOfRecordService,
  ) {}

  private readonly severityQueryConfigs = {
    testSummary: { table: 'camdecmpswks.test_summary', idColumn: 'test_sum_id'},
    emissionEvaluation: { table: 'camdecmpswks.EMISSION_EVALUATION', idColumn: 'mon_plan_id'},
    monitorPlan: { table: 'camdecmpswks.monitor_plan', idColumn: 'mon_plan_id'},
    qaTee: { table: 'camdecmpswks.test_extension_exemption', idColumn: 'test_extension_exemption_id'},
    qaCertEvent: { table: 'camdecmpswks.qa_cert_event', idColumn: 'qa_cert_event_id'},
  };

  async getSeverityFromConfig(configKey: string, idValue: string | number, evalStatusCode: string, rptPeriodIdentifier: number = null): 
  Promise<{
  severityDescription: string | undefined
  color: string[]
  } | null> {
    const config = this.severityQueryConfigs[configKey];
    const errorValues = ['CRIT2', 'CRIT3', 'FATAL', 'CRIT1'];
    let severityDescription = null;
    let color = null;
    let result = null;
    let sql = null;
    const parameters = [idValue]
    
    if(configKey == "emissionEvaluation")
        {
          sql =`select sc.severity_cd from ${config.table} em
             JOIN camdecmpsmd.reporting_period prd ON prd.rpt_period_id = em.rpt_period_id 
             JOIN camdecmpswks.monitor_plan pln ON pln.mon_plan_id = em.mon_plan_id 
             JOIN camdecmpswks.check_session cs on cs.chk_session_id = em.chk_session_id
             JOIN camdecmpsmd.severity_code sc on sc.severity_cd = cs.severity_cd
             where  em.${config.idColumn} = $1 and em.rpt_period_id = $2;`;
        }
    else{
          sql = `SELECT sc.severity_cd
            FROM ${config.table} t
            JOIN camdecmpswks.check_session cs on cs.chk_session_id = t.chk_session_id
            JOIN camdecmpsmd.severity_code sc on sc.severity_cd = cs.severity_cd
            WHERE t.${config.idColumn} = $1;`;
        }
    if(rptPeriodIdentifier != null)
      {
          parameters.push(rptPeriodIdentifier)
      }
    result = await this.entityManager.query(sql, parameters);
                         
    const severityCode = await this.entityManager.findOneBy(SeverityCode, {
                         severityCode: result?.[0]?.severity_cd
                         });

    severityDescription = severityCode?.severityCodeDescription;
    if(errorValues.includes(result?.[0]?.severity_cd))
      color = this.getReportColors('ERR');
    else
      color = this.getReportColors(evalStatusCode);
    
    return {
            severityDescription: severityDescription,
            color: color
          };
  }

  returnManager() {
    return this.entityManager;
  }

  getReportColors(evalStatusCd: string) {
    if (evalStatusCd !== 'PASS' && evalStatusCd !== 'INFO') {
      return ['#faf3d1', '#ffbe2e'];
    }
    return ['#ecf3ec', '#00a91c'];
  }

  async getSystemComponentIdentifier(
    monitorSystem: string,
    componentId: string,
  ) {
    if (monitorSystem) {
      const ms = await this.returnManager().findOneBy(MonitorSystem, {
        monSystemIdentifier: monitorSystem,
      });
      if (ms && ms.systemIdentifier) {
        return ms.systemIdentifier;
      }
    }
    if (componentId) {
      const c = await this.returnManager().findOneBy(Component, {
        componentId,
      });
      return c.componentIdentifier;
    }
  }

  async formatTestDataContext(
    templateContext: Record<string, any>,
    records: Array<Evaluation | SubmissionQueue>,
    orisCode: number | null,
    mappedStatusCodes: Map<string, string>,
  ) {
    const testDataKeys = [
      'System / Component Id',
      'Test Number',
      'Test Type',
      'Test Reason',
      'Test Result',
    ];

    testDataKeys.push('Evaluation Status Code');

    if (records.length > 0) {
      templateContext['testData'] = {
        keys: testDataKeys,
        items: [],
      };
      for (const testRecord of records) {
        const newItem: any = {};
        const testSumRecord: TestSummary | TestSummaryGlobal | null =
          testRecord.testSumIdentifier &&
          (await this.returnManager().findOneBy(
            TestSummary,
            { testSumIdentifier: testRecord.testSumIdentifier },
          ));

        if (testSumRecord) {
          newItem['System / Component Id'] =
            await this.getSystemComponentIdentifier(
              testSumRecord.monSystemIdentifier,
              testSumRecord.componentIdentifier,
            );
          newItem['Test Number'] = testSumRecord.testNumber;
          newItem['Test Type'] = testSumRecord.testTypeCode;
          newItem['Test Reason'] = testSumRecord.testReasonCode;
          newItem['Test Result'] = testSumRecord.testResultCode;

          if (testSumRecord instanceof TestSummary) {
              let result = await this.getSeverityFromConfig('testSummary', testSumRecord.testSumIdentifier, testSumRecord.evalStatusCode);
              newItem['evalStatusCode']  = result?.severityDescription;
              newItem['reportColor'] = result?.color[0];
              newItem['reportLineColor'] = result?.color[1];
          }

          newItem['reportUrl'] = `${this.configService.get<string>(
            'app.ecmpsHost',
          )}/workspace/reports?reportCode=TEST_EVAL&facilityId=${orisCode}&testId=${
            testSumRecord.testSumIdentifier
          }`;

          templateContext['testData'].items.push(newItem);
        }
      }
    }
    return templateContext;
  }

  async formatCertEventsContext(
    templateContext: Record<string, any>,
    records: Array<Evaluation | SubmissionQueue>,
    orisCode: number | null,
    mappedStatusCodes: Map<string, string>,
  ) {
    const certEventKeys = [
      'System / Component Id',
      'Cert Event Code',
      'Required Test Code',
    ];

    certEventKeys.push('Evaluation Status Code');

    if (records.length > 0) {
      templateContext['certEvents'] = {
        keys: certEventKeys,
        items: [],
      };
      for (const certRecord of records) {
        const newItem: any = {};
        const certEventRecord: QaCertEvent | QaCertEventGlobal | null =
          certRecord.qaCertEventIdentifier &&
          (await this.returnManager().findOneBy(QaCertEvent,
            { qaCertEventIdentifier: certRecord.qaCertEventIdentifier },
          ));

        if (certEventRecord) {
          newItem['System / Component Id'] =
            await this.getSystemComponentIdentifier(
              certEventRecord.monSystemIdentifier,
              certEventRecord.componentIdentifier,
            );
          newItem['Cert Event Code'] = certEventRecord.qaCertEventCode;
          newItem['Required Test Code'] = certEventRecord.requiredTestCode;

          if (certEventRecord instanceof QaCertEvent) {
              let result = await this.getSeverityFromConfig('qaCertEvent', certEventRecord.qaCertEventIdentifier, certEventRecord.evalStatusCode);
              newItem['evalStatusCode']  = result?.severityDescription;
              newItem['reportColor'] = result?.color[0];
              newItem['reportLineColor'] = result?.color[1];            
          }

          newItem['reportUrl'] = `${this.configService.get<string>(
            'app.ecmpsHost',
          )}/workspace/reports?reportCode=QCE_EVAL&facilityId=${orisCode}&qceId=${
            certEventRecord.qaCertEventIdentifier
          }`;

          templateContext['certEvents'].items.push(newItem);
        }
      }
    }
    return templateContext;
  }

  async formatTeeContext(
    templateContext: Record<string, any>,
    records: Array<Evaluation | SubmissionQueue>,
    orisCode: number | null,
    mappedStatusCodes: Map<string, string>,
  ) {
    const teeKeys = [
      'System / Component Id',
      'Year / Quarter',
      'Fuel Code',
      'Extension Exemption Code',
      'Hours Used',
      'Span Scale Code',
    ];

    teeKeys.push('Evaluation Status Code');

    if (records.length > 0) {
      templateContext['teeEvents'] = {
        keys: teeKeys,
        items: [],
      };

      for (const tee of records) {
        const newItem: any = {};
        const teeRecord: QaTee | QaTeeGlobal | null =
          tee.testExtensionExemptionIdentifier &&
          (await this.returnManager().findOneBy(QaTee,
            {
              testExtensionExemptionIdentifier:
              tee.testExtensionExemptionIdentifier,
            },
          ));
        const reportPeriodInfo =
          teeRecord &&
          (await this.returnManager().findOneBy(ReportingPeriod, {
            rptPeriodIdentifier: teeRecord.rptPeriodIdentifier,
          }));

        if (teeRecord) {
          newItem['System / Component Id'] =
            await this.getSystemComponentIdentifier(
              teeRecord.monSystemIdentifier,
              teeRecord.componentIdentifier,
            );
          newItem['Year / Quarter'] = reportPeriodInfo?.periodAbbreviation;
          newItem['Fuel Code'] = teeRecord.fuelCode;
          newItem['Extension Exemption Code'] = teeRecord.extensExemptCode;
          newItem['Hours Used'] = teeRecord.hoursUsed;
          newItem['Span Scale Code'] = teeRecord.spanScaleCode;

          if (teeRecord instanceof QaTee) {
              let result = await this.getSeverityFromConfig('qaTee', teeRecord.testExtensionExemptionIdentifier, teeRecord.evalStatusCode);
              newItem['evalStatusCode']  = result?.severityDescription;
              newItem['reportColor'] = result?.color[0];
              newItem['reportLineColor'] = result?.color[1];               
            }

          newItem['reportUrl'] = `${this.configService.get<string>(
            'app.ecmpsHost',
          )}/workspace/reports?reportCode=TEE_EVAL&facilityId=${orisCode}&teeId=${
            teeRecord.testExtensionExemptionIdentifier
          }`;

          templateContext['teeEvents'].items.push(newItem);
        }
      }
    }
    return templateContext;
  }

  async formatEmissionsContext(
    templateContext: Record<string, any>,
    records: Array<Evaluation | SubmissionQueue>,
    monitorPlanId: string,
    orisCode: number | null,
    mappedStatusCodes: Map<string, string>,
  ) {
    const emissionsKeys = ['Year / Quarter'];

    emissionsKeys.push('Evaluation Status Code');

    if (records.length > 0) {
      templateContext['emissions'] = {
        keys: emissionsKeys,
        items: [],
      };

      for (const em of records) {
        const newItem: any = {};
        const emissionsRecord: EmissionEvaluation | EmissionEvaluationGlobal =
          await this.returnManager().findOneBy(EmissionEvaluation,
            {
              monPlanIdentifier: monitorPlanId,
              rptPeriodIdentifier: em.rptPeriodIdentifier,
            },
          );

        if (emissionsRecord) {
          const reportPeriodInfo = await this.returnManager().findOneBy(
            ReportingPeriod,
            { rptPeriodIdentifier: emissionsRecord.rptPeriodIdentifier },
          );

          newItem['Year / Quarter'] = reportPeriodInfo.periodAbbreviation;

          if (emissionsRecord instanceof EmissionEvaluation) {
              let result = await this.getSeverityFromConfig('emissionEvaluation', emissionsRecord.monPlanIdentifier, emissionsRecord.evalStatusCode, emissionsRecord.rptPeriodIdentifier);
              newItem['evalStatusCode']  = result?.severityDescription;
              newItem['reportColor'] = result?.color[0];
              newItem['reportLineColor'] = result?.color[1]; 
            }

          newItem['reportUrl'] = `${this.configService.get<string>(
            'app.ecmpsHost',
          )}/workspace/reports?reportCode=EM_EVAL&facilityId=${orisCode}&monitorPlanId=${monitorPlanId}&year=${
            reportPeriodInfo.calendarYear
          }&quarter=${reportPeriodInfo.quarter}`;

          templateContext['emissions'].items.push(newItem);
        }
      }
    }
    return templateContext;
  }

  async formatMATSContext(
    templateContext: Record<string, any>,
    records: SubmissionQueue[],
  ) {
    const matsKeys = ['Test Type', 'Test Number', 'File Name'];

    if (records.length > 0) {
      templateContext['mats'] = {
        keys: matsKeys,
        items: [],
      };

      for (const matsRecord of records) {
        const newItem: any = {};
        const mats: MatsBulkFile =
          matsRecord.matsBulkFileId &&
          (await this.returnManager().findOneBy(MatsBulkFile, {
            id: matsRecord.matsBulkFileId,
          }));

        newItem['Test Type'] = mats?.testTypeGroupDescription;
        newItem['Test Number'] = mats?.testNumber;
        newItem['File Name'] = mats?.fileName;

        templateContext['mats'].items.push(newItem);
      }
    }
    return templateContext;
  }

  displayCurrentDate = () => {
    const date = new Date();

    return date.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  async sendEmailWithRetry(
    to: string,
    cc: string,
    from: string,
    subject: string,
    template: string,
    templateContext: any,
    attempt: number = 1,
    attachments: object[] = [],
  ): Promise<void> {
    if (attempt < 3) {
      try {
        await this.mailerService.sendMail({
          to, // List of receivers email addresses
          cc,
          from,
          subject,
          template,
          context: templateContext,
          attachments,
        });
      } catch (err) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000 * attempt));
        // Retry sending the email
        await this.sendEmailWithRetry(
          to, // List of receivers email address
          cc,
          from,
          subject,
          template,
          templateContext,
          attempt + 1,
          attachments,
        );
      }
    } else {
      throw new EaseyException(
        new Error('Exceeded email attempt retry threshold'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  async buildEvalReports(
    set: EvaluationSet | SubmissionSet,
    records: Array<Evaluation | SubmissionQueue>,
    documents: object[],
  ) {
    //Handle QA
    const testSumRecords = records.filter(
      (r) => r.processCode === 'QA' && r.testSumIdentifier != null,
    );
    if (testSumRecords.length > 0) {
      const paramsTestSum = new ReportParamsDTO();
      paramsTestSum.facilityId = set.orisCode;

      let title = 'TEST_DETAIL_EVAL';
      paramsTestSum.reportCode = 'TEST_EVAL';
      paramsTestSum.testId = testSumRecords.map((tsr) => tsr.testSumIdentifier);

      const reportInformationTestSum = await this.dataSetService.getDataSet(
        paramsTestSum,
        true,
      );
      const evalStatusCodes = new Set(
        testSumRecords.map((tsr) => {
          if ('evalStatusCode' in tsr) {
            return tsr.evalStatusCode;
          }
        }),
      );

      documents.push({
        filename: `${set.orisCode}_${title}.html`,
        content: this.copyOfRecordService.generateCopyOfRecord(
          reportInformationTestSum,
          false,
          evalStatusCodes,
        ),
      });
    }

    const qaCertRecords = records.filter(
      (r) => r.processCode === 'QA' && r.qaCertEventIdentifier != null,
    );
    if (qaCertRecords.length > 0) {
      const paramsCert = new ReportParamsDTO();
      paramsCert.facilityId = set.orisCode;

      let title = 'QCE_EVAL';
      paramsCert.reportCode = 'QCE_EVAL';
      paramsCert.qceId = qaCertRecords.map((qce) => qce.qaCertEventIdentifier);

      const reportInformationQCE = await this.dataSetService.getDataSet(
        paramsCert,
        true,
      );

      const evalStatusCodes = new Set(
        qaCertRecords.map((qce) => {
          if ('evalStatusCode' in qce) {
            return qce.evalStatusCode;
          }
        }),
      );

      documents.push({
        filename: `${set.orisCode}_${title}.html`,
        content: this.copyOfRecordService.generateCopyOfRecord(
          reportInformationQCE,
          false,
          evalStatusCodes,
        ),
      });
    }

    const teeRecords = records.filter(
      (r) =>
        r.processCode === 'QA' && r.testExtensionExemptionIdentifier != null,
    );
    if (teeRecords.length > 0) {
      const paramsTee = new ReportParamsDTO();
      paramsTee.facilityId = set.orisCode;

      let title = 'TEE_EVAL';
      paramsTee.reportCode = 'TEE_EVAL';
      paramsTee.teeId = teeRecords.map(
        (tee) => tee.testExtensionExemptionIdentifier,
      );

      const reportInformationTEE = await this.dataSetService.getDataSet(
        paramsTee,
        true,
      );

      const evalStatusCodes = new Set(
        teeRecords.map((tee) => {
          if ('evalStatusCode' in tee) {
            return tee.evalStatusCode;
          }
        }),
      );

      documents.push({
        filename: `${set.orisCode}_${title}.html`,
        content: this.copyOfRecordService.generateCopyOfRecord(
          reportInformationTEE,
          false,
          evalStatusCodes,
        ),
      });
    }

    for (const rec of records) {
      if (rec.processCode !== 'QA') {
        const params = new ReportParamsDTO();
        params.facilityId = set.orisCode;

        let titleContext = '';
        const evalStatusCodes = new Set<string>();
        // Add Eval Report
        if (rec.processCode === 'MP') {
          if ('evalStatusCode' in rec) {
            evalStatusCodes.add(rec.evalStatusCode);
          }

          titleContext = 'MP_EVAL_' + set.monPlanIdentifier;
          params.reportCode = 'MP_EVAL';
          params.monitorPlanId = set.monPlanIdentifier;
        } else if (rec.processCode === 'EM') {
          if ('evalStatusCode' in rec) {
            evalStatusCodes.add(rec.evalStatusCode);
          }
          const rptPeriod: ReportingPeriod =
            rec.rptPeriodIdentifier &&
            (await this.returnManager().findOneBy(ReportingPeriod, {
              rptPeriodIdentifier: rec.rptPeriodIdentifier,
            }));

          params.reportCode = 'EM_EVAL';
          params.monitorPlanId = set.monPlanIdentifier;
          params.year = rptPeriod?.calendarYear;
          params.quarter = rptPeriod?.quarter;

          titleContext =
            'EM_EVAL_' +
            params.monitorPlanId +
            '_' +
            params.year +
            'q' +
            params.quarter;
        }

        const reportInformation = await this.dataSetService.getDataSet(
          params,
          true,
        );

        documents.push({
          filename: `${set.orisCode}_${titleContext}.html`,
          content: this.copyOfRecordService.generateCopyOfRecord(
            reportInformation,
            false,
            evalStatusCodes,
          ),
        });
      }
    }
  }

  async sendMassEvalEmail(
    to: string,
    cc: string,
    from: string,
    setId: string,
  ) {
    //Create our lookup map of eval codes to descriptions
    const statusCodes = await this.returnManager().query(
      'SELECT * FROM camdecmpsmd.eval_status_code',
    );
    const mappedStatusCodes = new Map<string, string>();
    statusCodes.forEach((cd) => {
      mappedStatusCodes.set(
        cd['eval_status_cd'],
        cd['eval_status_cd_description'],
      );
    });

    const mpKeys = [
      'Facility Name',
      'Configuration',
      'Oris Code',
      'State Code',
      'County',
    ];

    let subject;
    let template;
    let setRecord: SubmissionSet | EvaluationSet;
    let records: Array<SubmissionQueue | Evaluation>;

    let templateContext: any = {};
    const documents = [];

    template = 'massEvaluationTemplate';
    records = await this.returnManager().find(Evaluation, {
      where: { evaluationSetIdentifier: setId },
    });
    setRecord = await this.returnManager().findOneBy(EvaluationSet, {
      evaluationSetIdentifier: setId,
    });

    const env = this.configService.get<string>('app.env')?.trim()?.toLowerCase();
    const subjectSuffix = env && !['prod', 'production', ''].includes(env) ? ` (sent from ECMPS 2.0 ${env})` : '';
    subject = `$ECMPS Evaluation Report for ORIS Code ${setRecord?.orisCode} ${setRecord?.configuration} | ${this.displayCurrentDate()} ${subjectSuffix}`;

    await this.buildEvalReports(setRecord, records, documents);

    // Build the context for our email --------------------------------------
    templateContext['dateEvaluated'] = this.displayCurrentDate();
    templateContext['cdxUrl'] = this.configService.get<string>('app.cdxUrl');

    // Create Monitor Plan Section of Email
    const mpRecord: MonitorPlan | MonitorPlanGlobal =
      await this.returnManager().findOneBy( MonitorPlan,
        { monPlanIdentifier: setRecord.monPlanIdentifier },
      );
    const plant = await this.returnManager().findOneBy(Plant, {
      facIdentifier: mpRecord.facIdentifier,
    });
    const county =
      plant.countyCode &&
      (await this.returnManager().findOneBy(CountyCode, {
        countyCode: plant.countyCode,
      }));

    templateContext['monitorPlan'] = {
      keys: mpKeys,
      items: [
        {
          ['Facility Name']: setRecord.facName,
          ['Configuration']: setRecord.configuration,
          ['Oris Code']: plant.orisCode,
          ['State Code']: plant.state,
          ['County']: county?.countyName,
        },
      ],
    };

    const mpChildRecord = records.find((r) => r.processCode === 'MP');
    if (mpChildRecord) {
      if (mpRecord instanceof MonitorPlan) {
            let result = await this.getSeverityFromConfig('monitorPlan', mpRecord.monPlanIdentifier, mpRecord.evalStatusCode);
            templateContext['monitorPlan'].items['evalStatus'] = result?.severityDescription;
            templateContext['monitorPlan'].items['reportColor'] = result?.color[0];
            templateContext['monitorPlan'].items['reportLineColor'] = result?.color[1];
      }

      templateContext['monitorPlan'].items[
        'reportUrl'
      ] = `${this.configService.get<string>(
        'app.ecmpsHost',
      )}/workspace/reports?reportCode=MP_EVAL&facilityId=${
        plant.orisCode
      }&monitorPlanId=${mpRecord.monPlanIdentifier}`;
    }

    //Create QA Section of Email ----------------------------------------
    const testDataChildRecords = records.filter(
      (r) => r.processCode === 'QA' && r.testSumIdentifier !== null,
    );
    templateContext = await this.formatTestDataContext(
      templateContext,
      testDataChildRecords,
      plant.orisCode,
      mappedStatusCodes,
    );

    const certChildRecords = records.filter(
      (r) => r.processCode === 'QA' && r.qaCertEventIdentifier !== null,
    );
    templateContext = await this.formatCertEventsContext(
      templateContext,
      certChildRecords,
      plant.orisCode,
      mappedStatusCodes,
    );

    const teeChildRecords = records.filter(
      (r) =>
        r.processCode === 'QA' && r.testExtensionExemptionIdentifier !== null,
    );
    templateContext = await this.formatTeeContext(
      templateContext,
      teeChildRecords,
      plant.orisCode,
      mappedStatusCodes,
    );

    //Create Emissions Section of Email
    const emissionsChildRecords = records.filter((r) => r.processCode === 'EM');
    templateContext = await this.formatEmissionsContext(
      templateContext,
      emissionsChildRecords,
      mpRecord.monPlanIdentifier,
      plant.orisCode,
      mappedStatusCodes,
    );

    this.sendEmailWithRetry(
      to,
      cc,
      from,
      subject,
      template,
      templateContext,
      1,
      documents,
    );
  }
}
