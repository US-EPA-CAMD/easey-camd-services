import { Test } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';

import { MonitorPlan } from '../entities/monitor-plan.entity';
import { MonitorLocation } from '../entities/monitor-location.entity';
import { EvaluationItem } from '../dto/evaluation.dto';
import { Plant } from '../entities/plant.entity';
import { QaCertEvent } from '../entities/qa-cert-event.entity';
import { QaTee } from '../entities/qa-tee.entity';
import { MatsBulkFile } from '../entities/mats-bulk-file.entity';
import { ReportingPeriod } from '../entities/reporting-period.entity';
import { EmissionEvaluation } from '../entities/emission-evaluation.entity';
import { SubmissionService } from './submission.service';
import { SubmissionQueueDTO } from '../dto/submission-queue.dto';
import { QaSuppData } from '../entities/qa-supp.entity';
import { CombinedSubmissionsMap } from '../maps/combined-submissions.map';
import { EmissionsLastUpdatedMap } from '../maps/emissions-last-updated.map';
import { CheckSession } from '../entities/check-session.entity';
import { ErrorHandlerService } from './error-handler.service';
import { SubmissionSetHelperService } from './submission-set-helper.service';

const dtoItem = new EvaluationItem();
dtoItem.monPlanId = 'mock';
dtoItem.submitMonPlan = true;
dtoItem.testSumIds = ['mock', 'mock'];
dtoItem.qceIds = ['mock'];
dtoItem.teeIds = ['mock'];
dtoItem.emissionsReportingPeriods = ['2020 Q1'];
dtoItem.matsBulkFiles = [];

const payloadDto = new SubmissionQueueDTO();
payloadDto.items = [dtoItem, dtoItem];
payloadDto.userId = 'testUser';
payloadDto.userEmail = 'test@example.com';
payloadDto.activityId = 'activity123';
payloadDto.hasCritErrors = false;

describe('-- Submission Service --', () => {
  let service: SubmissionService;
  let entityManagerMock: any;
  let errorHandlerServiceMock: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    errorHandlerServiceMock = {
      handleError: jest.fn(),
      handleQueueingError: jest.fn(),
      handleSubmissionProcessingError: jest.fn(),
      sendEmail: jest.fn(),
    };

    const queryMock = jest.fn().mockResolvedValue([
      {
        get_mp_location_list: 'Location1',
      },
    ]);

    const mockMonitorPlan = new MonitorPlan();
    mockMonitorPlan.facIdentifier = 1;
    mockMonitorPlan.locations = [{
      monLocIdentifier: 'test-loc',
      stackPipeIdentifier: 'test-stack',
      unitIdentifier: 1,
      userid: 'test-user',
      addDate: new Date().toISOString(),
      updateDate: new Date().toISOString(),
      stackPipe: null,
      unit: null,
      plans: []
    } as MonitorLocation];

    const findOneMock = jest.fn().mockResolvedValue(mockMonitorPlan);
    const findOneByMock = jest.fn().mockImplementation((entity, criteria) => {
      switch (entity) {
        case MonitorPlan:
          return mockMonitorPlan;
        case Plant:
          const p = new Plant();
          p.facilityName = 'testFacility';
          p.orisCode = 123;
          return p;
        case QaSuppData:
          return new QaSuppData();
        case QaCertEvent:
          return new QaCertEvent();
        case QaTee:
          return new QaTee();
        case ReportingPeriod:
          const rp = new ReportingPeriod();
          rp.rptPeriodIdentifier = 1;
          return rp;
        case CheckSession:
          const cs = new CheckSession();
          cs.severityCode = 'NONE';
          return cs;
        case EmissionEvaluation:
          return new EmissionEvaluation();
        case MatsBulkFile:
          return new MatsBulkFile();
        default:
          return null;
      }
    });

    const saveMock = jest.fn();
    const countByMock = jest.fn().mockResolvedValue(0);

    const createQueryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    const transactionMock = jest.fn(async (fn) => {
      return fn(entityManagerMock);
    });

    entityManagerMock = {
      query: queryMock,
      findOne: findOneMock,
      findOneBy: findOneByMock,
      countBy: countByMock,
      save: saveMock,
      transaction: transactionMock,
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock),
    };

    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      controllers: [],
      providers: [
        SubmissionService,
        {
          provide: EntityManager,
          useValue: entityManagerMock,
        },
        {
          provide: ErrorHandlerService,
          useValue: errorHandlerServiceMock,
        },
        {
          provide: SubmissionSetHelperService,
          useValue: {
            updateSubmissionSetStatus: jest.fn(),
            setRecordStatusCode: jest.fn(),
            getFormattedDateTime: jest.fn(),
          },
        },
        CombinedSubmissionsMap,
        EmissionsLastUpdatedMap,
      ],
    }).compile();

    service = module.get(SubmissionService);

    // Mock returnManager after service is created
    jest.spyOn(service, 'returnManager').mockReturnValue(entityManagerMock);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  describe('queueSubmissionRecords', () => {
    it('should set hasCritErrors to true when CRIT1 errors exist', async () => {
      const checkSessionWithCrit1 = new CheckSession();
      checkSessionWithCrit1.severityCode = 'CRIT1';

      const createQueryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(checkSessionWithCrit1),
      };

      entityManagerMock.createQueryBuilder = jest.fn().mockReturnValue(createQueryBuilderMock);

      await service.queueSubmissionRecords(payloadDto);

      // Verify hasCritErrors was set to true in the saved SubmissionSet
      const saveCall = entityManagerMock.save.mock.calls.find(
        call => call[1] && call[1].hasCritErrors !== undefined
      );
      expect(saveCall[1].hasCritErrors).toBe(true);
    });

    it('should set hasCritErrors to false when only CRIT2 errors exist', async () => {
      // When checking for CRIT1 errors, should return null since there are only CRIT2 errors
      const createQueryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      entityManagerMock.createQueryBuilder = jest.fn().mockReturnValue(createQueryBuilderMock);

      await service.queueSubmissionRecords(payloadDto);

      // Verify hasCritErrors was set to false in the saved SubmissionSet
      const saveCall = entityManagerMock.save.mock.calls.find(
        call => call[1] && call[1].hasCritErrors !== undefined
      );
      expect(saveCall[1].hasCritErrors).toBe(false);
    });

    it('should set hasCritErrors to false when no critical errors exist', async () => {
      const checkSessionNoErrors = new CheckSession();
      checkSessionNoErrors.severityCode = 'NONE';

      const createQueryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      entityManagerMock.createQueryBuilder = jest.fn().mockReturnValue(createQueryBuilderMock);

      await service.queueSubmissionRecords(payloadDto);

      // Verify hasCritErrors was set to false in the saved SubmissionSet
      const saveCall = entityManagerMock.save.mock.calls.find(
        call => call[1] && call[1].hasCritErrors !== undefined
      );
      expect(saveCall[1].hasCritErrors).toBe(false);
    });
  });
});
