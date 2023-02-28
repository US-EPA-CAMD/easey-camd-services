import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { MailService } from './mail.service';
import { HttpModule } from '@nestjs/axios';
import { MailerService } from '@nestjs-modules/mailer';
import { ClientConfig } from '../entities/client-config.entity';
import { CreateMailDto } from '../dto/create-mail.dto';
import { EntityManager } from 'typeorm';
import { MonitorSystem } from '../entities/monitor-system.entity';
import { Component } from '../entities/component.entity';
import { TestSummary } from '../entities/test-summary.entity';
import { Evaluation } from '../entities/evaluation.entity';
import { QaCertEvent } from '../entities/qa-cert-event.entity';
import { QaTee } from '../entities/qa-tee.entity';
import { ReportingPeriod } from '../entities/reporting-period.entity';
import { EmissionEvaluation } from '../entities/emission-evaluation.entity';
import { EvaluationSet } from '../entities/evaluation-set.entity';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { Plant } from '../entities/plant.entity';
import { CountyCode } from '../entities/county-code.entity';
import { MassEvalParamsDTO } from '../dto/mass-eval-params.dto';

const mockEvalList = [new Evaluation(), new Evaluation(), new Evaluation()];

describe('Mail Service', () => {
  let service: MailService;
  let wrapperService: MailerService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      providers: [
        MailService,
        {
          provide: MailerService,
          useFactory: () => ({
            sendMail: jest.fn().mockResolvedValue({}),
          }),
        },
      ],
    }).compile();

    service = module.get(MailService);
    wrapperService = module.get(MailerService);

    const mockManager = {
      findOne: jest.fn().mockImplementation((val) => {
        switch (val.name) {
          case 'ClientConfig':
            return new ClientConfig();
        }
      }),
    } as any as EntityManager;

    jest.spyOn(service, 'returnManager').mockReturnValue(mockManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fire off a basic email', async () => {
    await service.sendEmail('', new CreateMailDto());
    expect(wrapperService.sendMail).toHaveBeenCalled();
  });

  it('get report color red', async () => {
    expect(service.getReportColor('ERR')).toEqual('#FF6862');
  });

  it('get report color green', async () => {
    expect(service.getReportColor('PASS')).toEqual('#90EE90');
  });

  it('get report color green', async () => {
    expect(service.getReportColor('PASS')).toEqual('#90EE90');
  });

  it('get system / component id correctly with just system present', async () => {
    const ms = new MonitorSystem();
    ms.systemIdentifier = 'MOCK-S';

    const mockManager = {
      findOne: jest.fn().mockImplementation((val) => {
        switch (val.name) {
          case 'MonitorSystem':
            return ms;
        }
      }),
    } as any as EntityManager;

    jest.spyOn(service, 'returnManager').mockReturnValue(mockManager);
    expect(await service.getSystemComponentIdentifier('', '')).toEqual(
      'MOCK-S',
    );
  });

  it('get system / component id correctly with just component present', async () => {
    const c = new Component();
    c.componentIdentifier = 'MOCK-C';
    const mockManager = {
      findOne: jest.fn().mockImplementation((val) => {
        switch (val.name) {
          case 'MonitorSystem':
            return undefined;
          case 'Component':
            return c;
        }
      }),
    } as any as EntityManager;

    jest.spyOn(service, 'returnManager').mockReturnValue(mockManager);
    expect(await service.getSystemComponentIdentifier('', '')).toEqual(
      'MOCK-C',
    );
  });

  it('format test data context correctly', async () => {
    const ts = new TestSummary();

    const mockManager = {
      findOne: jest.fn().mockImplementation((val) => {
        switch (val.name) {
          case 'TestSummary':
            return ts;
        }
      }),
    } as any as EntityManager;

    jest
      .spyOn(service, 'getSystemComponentIdentifier')
      .mockResolvedValue('MOCK');
    jest.spyOn(service, 'getReportColor').mockReturnValue('#FF6862');
    jest.spyOn(service, 'returnManager').mockReturnValue(mockManager);
    const result = await service.formatTestDataContext({}, mockEvalList, 3);
    expect(result['testData'].items.length).toEqual(3);
    expect(result['testData'].items[0]['System / Component Id']).toEqual(
      'MOCK',
    );
  });

  it('format cert event data context correctly', async () => {
    const ce = new QaCertEvent();
    const mockManager = {
      findOne: jest.fn().mockImplementation((val) => {
        switch (val.name) {
          case 'QaCertEvent':
            return ce;
        }
      }),
    } as any as EntityManager;

    jest
      .spyOn(service, 'getSystemComponentIdentifier')
      .mockResolvedValue('MOCK');
    jest.spyOn(service, 'getReportColor').mockReturnValue('#FF6862');
    jest.spyOn(service, 'returnManager').mockReturnValue(mockManager);
    const result = await service.formatCertEventsContext({}, mockEvalList, 3);
    expect(result['certEvents'].items.length).toEqual(3);
    expect(result['certEvents'].items[0]['System / Component Id']).toEqual(
      'MOCK',
    );
  });

  it('format tee data context correctly', async () => {
    const tee = new QaTee();
    const mockManager = {
      findOne: jest.fn().mockImplementation((val) => {
        switch (val.name) {
          case 'QaTee':
            return tee;
          case 'ReportingPeriod':
            return new ReportingPeriod();
        }
      }),
    } as any as EntityManager;

    jest
      .spyOn(service, 'getSystemComponentIdentifier')
      .mockResolvedValue('MOCK');
    jest.spyOn(service, 'getReportColor').mockReturnValue('#FF6862');
    jest.spyOn(service, 'returnManager').mockReturnValue(mockManager);
    const result = await service.formatTeeContext({}, mockEvalList, 3);
    expect(result['teeEvents'].items.length).toEqual(3);
    expect(result['teeEvents'].items[0]['System / Component Id']).toEqual(
      'MOCK',
    );
  });

  it('format emissions data context correctly', async () => {
    const emission = new EmissionEvaluation();

    const rp = new ReportingPeriod();
    rp.periodAbbreviation = 'MOCK';

    const mockManager = {
      findOne: jest.fn().mockImplementation((val) => {
        switch (val.name) {
          case 'EmissionEvaluation':
            return emission;
          case 'ReportingPeriod':
            return rp;
        }
      }),
    } as any as EntityManager;

    jest
      .spyOn(service, 'getSystemComponentIdentifier')
      .mockResolvedValue('MOCK');
    jest.spyOn(service, 'getReportColor').mockReturnValue('#FF6862');
    jest.spyOn(service, 'returnManager').mockReturnValue(mockManager);
    const result = await service.formatEmissionsContext({}, mockEvalList, 3);
    expect(result['emissions'].items.length).toEqual(3);
    expect(result['emissions'].items[0]['Year / Quarter']).toEqual('MOCK');
  });

  it('send mass eval email correctly without errors', async () => {
    const mockMpRecord = new Evaluation();
    mockMpRecord.processCode = 'MP';

    const mockManager = {
      findOne: jest.fn().mockImplementation((val) => {
        switch (val.name) {
          case 'EvaluationSet':
            return new EvaluationSet();
          case 'MonitorPlan':
            return new MonitorPlan();
          case 'Plant':
            return new Plant();
          case 'CountyCode':
            return new CountyCode();
        }
      }),
      find: jest.fn().mockImplementation((val) => {
        switch (val.name) {
          case 'Evaluation':
            return [mockMpRecord];
        }
      }),
    } as any as EntityManager;
    jest.spyOn(service, 'returnManager').mockReturnValue(mockManager);

    jest.spyOn(service, 'formatTestDataContext').mockResolvedValue({});
    jest.spyOn(service, 'formatCertEventsContext').mockResolvedValue({});
    jest.spyOn(service, 'formatTeeContext').mockResolvedValue({});
    jest.spyOn(service, 'formatEmissionsContext').mockResolvedValue({});

    await service.sendMassEvalEmail(new MassEvalParamsDTO());
    expect(wrapperService.sendMail).toHaveBeenCalled();
  });
});
