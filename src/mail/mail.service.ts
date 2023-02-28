import { HttpStatus, Injectable } from '@nestjs/common';
import { getManager } from 'typeorm';
import { CreateMailDto } from '../dto/create-mail.dto';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { ClientConfig } from '../entities/client-config.entity';
import { LoggingException } from '@us-epa-camd/easey-common/exceptions';
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
import { MassEvalParamsDTO } from '../dto/mass-eval-params.dto';

@Injectable()
export class MailService {
  constructor(
    private readonly logger: Logger,
    private readonly mailerService: MailerService,
  ) {}

  returnManager() {
    return getManager();
  }

  async sendEmail(clientId: string, payload: CreateMailDto): Promise<void> {
    const dbRecord = await this.returnManager().findOne<ClientConfig>(
      ClientConfig,
      clientId,
    );

    this.mailerService
      .sendMail({
        from: payload.fromEmail,
        to: dbRecord.supportEmail, // List of receivers email address
        subject: payload.subject, // Subject line
        context: { message: payload.message },
        template: 'default',
      })
      .then((success) => {
        console.log(success);
      })
      .catch((err) => {
        console.log(err);
      });

    this.logger.info('Successfully sent an email', {
      from: payload.fromEmail,
    });
  }

  getReportColor(evalStatusCd: string) {
    if (evalStatusCd !== 'PASS' && evalStatusCd !== 'INFO') {
      return '#FF6862';
    }
    return '#90EE90';
  }

  async getSystemComponentIdentifier(
    monitorSystem: string,
    componentId: string,
  ) {
    const ms = await this.returnManager().findOne(MonitorSystem, monitorSystem);
    if (ms && ms.systemIdentifier) {
      return ms.systemIdentifier;
    }
    const c = await this.returnManager().findOne(Component, componentId);
    return c.componentIdentifier;
  }

  async formatTestDataContext(templateContext, records, orisCode) {
    const testDataKeys = [
      'System / Component Id',
      'Test Number',
      'Test Type',
      'Test Reason',
      'Test Result',
      'Evaluation Status Code',
    ];

    if (records.length > 0) {
      templateContext['testData'] = {
        keys: testDataKeys,
        items: [],
      };
      for (const testRecord of records) {
        const newItem: any = {};
        const testSumRecord: TestSummary = await this.returnManager().findOne(
          TestSummary,
          testRecord.testSumIdentifier,
        );

        newItem['System / Component Id'] =
          await this.getSystemComponentIdentifier(
            testSumRecord.monSystemIdentifier,
            testSumRecord.componentIdentifier,
          );
        newItem['Test Number'] = testSumRecord.testNumber;
        newItem['Test Type'] = testSumRecord.testTypeCode;
        newItem['Test Reason'] = testSumRecord.testReasonCode;
        newItem['Test Result'] = testSumRecord.testResultCode;
        newItem['evalStatusCode'] = testSumRecord.evalStatusCode;
        newItem['reportColor'] = this.getReportColor(
          testSumRecord.evalStatusCode,
        );

        newItem[
          'reportUrl'
        ] = `https://ecmps-dev.app.cloud.gov/workspace/reports?reportCode=TEST_EVAL&facilityId=${orisCode}&testId=${testSumRecord.testSumIdentifier}`;

        templateContext['testData'].items.push(newItem);
      }
    }
    return templateContext;
  }

  async formatCertEventsContext(templateContext, records, orisCode) {
    const certEventKeys = [
      'System / Component Id',
      'Cert Event Code',
      'Required Test Code',
      'Evaluation Status Code',
    ];

    if (records.length > 0) {
      templateContext['certEvents'] = {
        keys: certEventKeys,
        items: [],
      };
      for (const certRecord of records) {
        const newItem: any = {};
        const certEventRecord: QaCertEvent = await this.returnManager().findOne(
          QaCertEvent,
          certRecord.qaCertEventIdentifier,
        );

        newItem['System / Component Id'] =
          await this.getSystemComponentIdentifier(
            certEventRecord.monSystemIdentifier,
            certEventRecord.componentIdentifier,
          );
        newItem['Cert Event Code'] = certEventRecord.qaCertEventCode;
        newItem['Required Test Code'] = certEventRecord.requiredTestCode;
        newItem['evalStatusCode'] = certEventRecord.evalStatusCode;
        newItem['reportColor'] = this.getReportColor(
          certEventRecord.evalStatusCode,
        );

        newItem[
          'reportUrl'
        ] = `https://ecmps-dev.app.cloud.gov/workspace/reports?reportCode=QCE_EVAL&facilityId=${orisCode}&qceId=${certEventRecord.qaCertEventIdentifier}`;

        templateContext['certEvents'].items.push(newItem);
      }
    }
    return templateContext;
  }

  async formatTeeContext(templateContext, records, orisCode) {
    const teeKeys = [
      'System / Component Id',
      'Year / Quarter',
      'Fuel Code',
      'Extension Exemption Code',
      'Hours Used',
      'Span Scale Code',
      'Evaluation Status Code',
    ];

    if (records.length > 0) {
      templateContext['teeEvents'] = {
        keys: teeKeys,
        items: [],
      };

      for (const tee of records) {
        const newItem: any = {};
        const teeRecord: QaTee = await this.returnManager().findOne(
          QaTee,
          tee.testExtensionExemptionIdentifier,
        );
        const reportPeriodInfo = await this.returnManager().findOne(
          ReportingPeriod,
          teeRecord.rptPeriodIdentifier,
        );

        newItem['System / Component Id'] =
          await this.getSystemComponentIdentifier(
            teeRecord.monSystemIdentifier,
            teeRecord.componentIdentifier,
          );
        newItem['Year / Quarter'] = reportPeriodInfo.periodAbbreviation;
        newItem['Fuel Code'] = teeRecord.fuelCode;
        newItem['Extension Exemption Code'] = teeRecord.extensExemptCode;
        newItem['Hours Used'] = teeRecord.hoursUsed;
        newItem['Span Scale Code'] = teeRecord.spanScaleCode;
        newItem['evalStatusCode'] = teeRecord.evalStatusCode;
        newItem['reportColor'] = this.getReportColor(teeRecord.evalStatusCode);

        newItem[
          'reportUrl'
        ] = `https://ecmps-dev.app.cloud.gov/workspace/reports?reportCode=TEE_EVAL&facilityId=${orisCode}&teeId=${teeRecord.testExtensionExemptionIdentifier}`;

        templateContext['teeEvents'].items.push(newItem);
      }
    }
    return templateContext;
  }

  async formatEmissionsContext(templateContext, records, monitorPlanId) {
    const emissionsKeys = ['Year / Quarter', 'Evaluation Status Code'];

    if (records.length > 0) {
      templateContext['emissions'] = {
        keys: emissionsKeys,
        items: [],
      };

      for (const em of records) {
        const newItem: any = {};
        const emissionsRecord: EmissionEvaluation =
          await this.returnManager().findOne(EmissionEvaluation, {
            where: {
              monPlanIdentifier: monitorPlanId,
              rptPeriodIdentifier: em.rptPeriodIdentifier,
            },
          });
        const reportPeriodInfo = await this.returnManager().findOne(
          ReportingPeriod,
          emissionsRecord.rptPeriodIdentifier,
        );

        newItem['Year / Quarter'] = reportPeriodInfo.periodAbbreviation;
        newItem['evalStatusCode'] = emissionsRecord.evalStatusCode;
        newItem['reportColor'] = this.getReportColor(
          emissionsRecord.evalStatusCode,
        );

        newItem['reportUrl'] = `https://google.com`;

        templateContext['emissions'].items.push(newItem);
      }
    }
    return templateContext;
  }

  displayCurrentDate = () => {
    const date = new Date();

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  async sendMassEvalEmail(params: MassEvalParamsDTO) {
    const mpKeys = [
      'Facility Name',
      'Configuration',
      'Oris Code',
      'State Code',
      'County',
      'Longitude',
      'Latitude',
    ];

    const records = await this.returnManager().find(Evaluation, {
      where: { evaluationSetIdentifier: params.evaluationSetId },
    });

    // Build the context for our email --------------------------------------
    let templateContext: any = {};
    templateContext['dateEvaluated'] = this.displayCurrentDate();

    // Create Monitor Plan Section of Email
    const setRecord = await this.returnManager().findOne(
      EvaluationSet,
      params.evaluationSetId,
    );
    const mpRecord = await this.returnManager().findOne(
      MonitorPlan,
      setRecord.monPlanIdentifier,
    );
    const plant = await this.returnManager().findOne(
      Plant,
      mpRecord.facIdentifier,
    );
    const county = await this.returnManager().findOne(
      CountyCode,
      plant.countyCode,
    );

    templateContext['monitorPlan'] = {
      keys: mpKeys,
      items: [
        {
          ['Facility Name']: setRecord.facName,
          ['Configuration']: setRecord.configuration,
          ['Oris Code']: plant.orisCode,
          ['State Code']: plant.state,
          ['County']: county.countyName,
          ['Longitude']: plant.longitude,
          ['Latitude']: plant.latitude,
        },
      ],
    };

    const mpChildRecord = records.find((r) => r.processCode === 'MP');
    if (mpChildRecord) {
      templateContext['monitorPlan'].items['evalStatus'] =
        mpRecord.evalStatusCode;
      templateContext['monitorPlan'].items['reportColor'] = this.getReportColor(
        mpRecord.evalStatusCode,
      );
      templateContext['monitorPlan'].items[
        'reportUrl'
      ] = `https://ecmps-dev.app.cloud.gov/workspace/reports?reportCode=MP_EVAL&facilityId=${plant.orisCode}&monitoPlanId=${mpRecord.monPlanIdentifier}`;
    }

    //Create QA Section of Email ----------------------------------------
    const testDataChildRecords = records.filter(
      (r) => r.processCode === 'QA' && r.testSumIdentifier !== null,
    );
    templateContext = await this.formatTestDataContext(
      templateContext,
      testDataChildRecords,
      plant.orisCode,
    );

    const certChildRecords = records.filter(
      (r) => r.processCode === 'QA' && r.qaCertEventIdentifier !== null,
    );
    templateContext = await this.formatCertEventsContext(
      templateContext,
      certChildRecords,
      plant.orisCode,
    );

    const teeChildRecords = records.filter(
      (r) =>
        r.processCode === 'QA' && r.testExtensionExemptionIdentifier !== null,
    );
    templateContext = await this.formatTeeContext(
      templateContext,
      teeChildRecords,
      plant.orisCode,
    );

    //Create Emissions Section of Email
    const emissionsChildRecords = records.filter((r) => r.processCode === 'EM');
    templateContext = await this.formatEmissionsContext(
      templateContext,
      emissionsChildRecords,
      mpRecord.monPlanIdentifier,
    );

    this.mailerService
      .sendMail({
        to: params.toEmail, // List of receivers email address
        from: params.fromEmail,
        subject: `ECMPS Evaluation Report | ${this.displayCurrentDate()}`, // Subject line
        template: 'massEvaluationTemplate',
        context: templateContext,
      })
      .then((success) => {
        console.log(success);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
