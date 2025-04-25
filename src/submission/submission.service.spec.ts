import { Test } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';

import { MonitorPlan } from '../entities/monitor-plan.entity';
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
import { SeverityCode } from '../entities/severity-code.entity';
import { SubmissionSet } from '../entities/submission-set.entity';

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

    const findOneByMock = jest.fn().mockImplementation((entity, criteria) => {
      switch (entity) {
        case MonitorPlan:
          const mp = new MonitorPlan();
          mp.facIdentifier = 1;
          return mp;
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

    const createQueryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(new CheckSession()),
    };

    // Mock for findOne method
    const findOneMock = jest.fn().mockImplementation((entity, criteria) => {
      if (entity === MonitorPlan) {
        const mp = new MonitorPlan();
        mp.facIdentifier = 1;
        mp.locations = []; // Add mock locations
        return mp;
      }
      return null;
    });

    const transactionMock = jest.fn(async (fn) => {
      return fn(entityManagerMock);
    });

    entityManagerMock = {
      query: queryMock,
      findOneBy: findOneByMock,
      findOne: findOneMock, // Add findOne mock
      find: jest.fn().mockResolvedValue([]), // Add find mock with empty array by default
      save: saveMock,
      transaction: transactionMock,
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock),
      countBy: jest.fn().mockResolvedValue(0), // Mock countBy to return 0 (meaning - no unsubmitted inactive plans)
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

    // Mock the returnManager method to return entityManagerMock
    service.returnManager = jest.fn().mockReturnValue(entityManagerMock);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

    // Test for checking critical errors based on evalStatusCode
  it('should check for critical errors based on evalStatusCode', async () => {
    // Mock the find method to return submission queue records
    const mockSubmissionQueueRecords = [
      { submissionSetIdentifier: 'test-set-id', severityCode: 'CRIT1' },
      { submissionSetIdentifier: 'test-set-id', severityCode: 'CRIT2' }
    ];
    entityManagerMock.find = jest.fn().mockResolvedValue(mockSubmissionQueueRecords);

    // Mock the findOneBy method for SeverityCode to return different evalStatusCode values
    const originalFindOneBy = entityManagerMock.findOneBy;
    entityManagerMock.findOneBy = jest.fn().mockImplementation((entity, criteria) => {
      if (entity === SeverityCode) {
        if (criteria.severityCode === 'CRIT1') {
          const severityCode = new SeverityCode();
          severityCode.severityCode = 'CRIT1';
          severityCode.evalStatusCode = 'ERR';
          return severityCode;
        } else if (criteria.severityCode === 'CRIT2') {
          const severityCode = new SeverityCode();
          severityCode.severityCode = 'CRIT2';
          severityCode.evalStatusCode = 'INFO';
          return severityCode;
        }
        return null;
      }
      return originalFindOneBy(entity, criteria);
    });

    // Create a test submission set
    const submissionSet = new SubmissionSet();
    submissionSet.submissionSetIdentifier = 'test-set-id';

    // Call the private queueRecord method through a transaction
    await service.queueSubmissionRecords(payloadDto);

    // Verify entityManager was saved and called with a submission set that has hasCritErrors = true
    // This is because one of the records has a severity code with evalStatusCode = 'ERR'
    expect(entityManagerMock.save).toHaveBeenCalledWith(
      SubmissionSet,
      expect.objectContaining({ hasCritErrors: true })
    );
  });
});
