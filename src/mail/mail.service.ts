import { HttpStatus, Injectable } from '@nestjs/common';
import { getManager } from 'typeorm';
import { CreateMailDto } from '../dto/create-mail.dto';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { ConfigService } from '@nestjs/config';
import { ClientConfig } from '../entities/client-config.entity';
import { LoggingException } from '@us-epa-camd/easey-common/exceptions';
import { MailerService } from '@nestjs-modules/mailer';
import { join } from 'path';
import { Evaluation } from '../entities/evaluation.entity';
import { EvaluationSet } from '../entities/evaluation-set.entity';
import { MonitorPlan } from 'src/entities/monitor-plan.entity';
import { Plant } from 'src/entities/plant.entity';
import { TestSummary } from 'src/entities/test-summary.entity';
import { MonitorSystem } from 'src/entities/monitor-system.entity';
import { Component } from 'src/entities/component.entity';
import { CountyCode } from 'src/entities/county-code.entity';
import { QaCertEvent } from 'src/entities/qa-cert-event.entity';
import { QaTee } from 'src/entities/qa-tee.entity';
import { ReportingPeriod } from 'src/entities/reporting-period.entity';

@Injectable()
export class MailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
    private readonly mailerService: MailerService,
  ) {}

  returnManager() {
    return getManager();
  }

  /*
  async sendEmail(clientId: string, payload: CreateMailDto): Promise<void> {
    const dbRecord = await this.returnManager().findOne<ClientConfig>(
      ClientConfig,
      clientId,
    );
    console.log(dbRecord);

    try {
      await transporter.sendMail({
        from: payload.fromEmail, // sender address
        to: dbRecord.supportEmail, // list of receivers
        subject: payload.subject, // Subject line
        text: payload.message,
      });
    } catch (e) {
      throw new LoggingException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    this.logger.info('Successfully sent an email', {
      from: payload.fromEmail,
    });
  }
  */

  async getSystemComponentIdentifier(
    monitorSystem: string,
    componentId: string,
  ) {
    const ms = await getManager().findOne(MonitorSystem, monitorSystem);
    if (ms && ms.systemIdentifier) {
      return ms.systemIdentifier;
    }
    const c = await getManager().findOne(Component, componentId);
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
        const testSumRecord = await getManager().findOne(
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
        const certEventRecord: QaCertEvent = await getManager().findOne(
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
        const teeRecord: QaTee = await getManager().findOne(
          QaTee,
          tee.testExtensionExemptionIdentifier,
        );
        const reportPeriodInfo = await getManager().findOne(
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

        newItem[
          'reportUrl'
        ] = `https://ecmps-dev.app.cloud.gov/workspace/reports?reportCode=TEE_EVAL&facilityId=${orisCode}&teeId=${teeRecord.testExtensionExemptionIdentifier}`;

        templateContext['teeEvents'].items.push(newItem);
      }
    }
    return templateContext;
  }

  async sendMassEvalEmail(evalSetId: string) {
    const mpKeys = [
      'Facility Name',
      'Configuration',
      'Oris Code',
      'State Code',
      'County',
      'Longitude',
      'Latitude',
    ];

    const records = await getManager().find(Evaluation, {
      where: { evaluationSetIdentifier: evalSetId },
    });

    //TODO: Move to Listener
    if (records.find((r) => r.statusCode !== 'COMPLETE')) {
      // There are still records to process do not send the email yet
      return;
    }

    // Build the context for our email --------------------------------------
    let templateContext: any = {};
    templateContext['dateEvaluated'] = new Date().toISOString();
    templateContext['logo'] = join(
      __dirname,
      'templates/images/epa-logo-blue.svg',
    );

    // Create Monitor Plan Section of Email
    const setRecord = await getManager().findOne(EvaluationSet, evalSetId);
    const mpRecord = await getManager().findOne(
      MonitorPlan,
      setRecord.monPlanIdentifier,
    );
    const plant = await getManager().findOne(Plant, mpRecord.facIdentifier);
    const county = await getManager().findOne(CountyCode, plant.countyCode);

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

    try {
      this.mailerService
        .sendMail({
          to: 'kyleherceg@gmail.com', // List of receivers email address
          subject: 'Testing Nest MailerModule ✔', // Subject line
          template: 'massEvaluationTemplate',
          context: templateContext,
        })
        .then((success) => {
          console.log(success);
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (e) {
      throw new LoggingException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
