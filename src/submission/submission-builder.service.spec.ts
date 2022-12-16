import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { SubmissionItem } from '../dto/submission.dto';
import SubmissionBuilder from './submission-builder.service';
import { QaSuppData } from '../entities/qa-supp.entity';
import { EmissionEvaluation } from '../entities/emissions-evaluation.entity';

const resusableMockUser = {
  userId: 'mockUser',
  sessionId: null,
  expiration: null,
  clientIp: null,
  isAdmin: false,
  permissionSet: [],
};

describe('-- Submission Builder Service --', () => {
  let service: SubmissionBuilder;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [SubmissionBuilder],
    }).compile();

    service = module.get(SubmissionBuilder);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  describe('handleDynamicSubmission', () => {
    it('should make the proper amount of calls and manipulations given the create dynamic record call with MP', async () => {
      const mockInsertion = jest.fn();
      const mockSave = jest.fn();

      const mockPlan = new MonitorPlan();

      jest.spyOn(service, 'returnManager').mockReturnValue({
        findOne: async (arg1, arg2) => {
          switch (arg1.name) {
            case 'MonitorPlan':
              return mockPlan;
            default:
              return null;
          }
        },
        insert: mockInsertion,
        save: mockSave,
      });

      const submissionItem = new SubmissionItem();

      await service.createDynamicSubmissionRecord(
        MonitorPlan,
        '',
        '',
        0,
        submissionItem,
        'MP',
      );

      expect(mockPlan.submissionAvailabilityCode).toEqual('PENDING');
    });

    it('should make the proper amount of calls and manipulations given the create dynamic record call with QA', async () => {
      const mockInsertion = jest.fn();
      const mockSave = jest.fn();

      const mockPlan = new MonitorPlan();
      const mockSupp = new QaSuppData();

      jest.spyOn(service, 'returnManager').mockReturnValue({
        findOne: async (arg1, arg2) => {
          switch (arg1.name) {
            case 'MonitorPlan':
              return mockPlan;
            case 'QaSuppData':
              return mockSupp;
            default:
              return null;
          }
        },
        insert: mockInsertion,
        save: mockSave,
      });

      const submissionItem = new SubmissionItem();

      await service.createDynamicSubmissionRecord(
        MonitorPlan,
        '',
        '',
        0,
        submissionItem,
        'QA',
        '2022 Q2',
        'testSumId',
        'testSumId',
      );

      expect(mockSupp.submissionAvailabilityCode).toEqual('PENDING');
    });

    it('should make the proper amount of calls and manipulations given the create dynamic record call with EM', async () => {
      const mockInsertion = jest.fn();
      const mockSave = jest.fn();

      const mockPlan = new MonitorPlan();
      const mockEm = new EmissionEvaluation();

      jest.spyOn(service, 'returnManager').mockReturnValue({
        findOne: async (arg1, arg2) => {
          switch (arg1.name) {
            case 'MonitorPlan':
              return mockPlan;
            case 'EmissionEvaluation':
              return mockEm;
            default:
              return null;
          }
        },
        insert: mockInsertion,
        save: mockSave,
      });

      const submissionItem = new SubmissionItem();

      await service.createDynamicSubmissionRecord(
        EmissionEvaluation,
        '',
        '',
        0,
        submissionItem,
        'EM',
        '2022 Q2',
      );

      expect(mockEm.submissionAvailabilityCode).toEqual('PENDING');
    });
  });

  describe('hasPermissions', () => {
    it('should return true given a user is an admin', async () => {
      const mockUser = {
        userId: 'mockUser',
        sessionId: null,
        expiration: null,
        clientIp: null,
        isAdmin: true,
        permissionSet: null,
      };
      const access = service.hasPermissions(mockUser, 3, 'MP');
      expect(access).toBe(true);
    });

    it('should return true given a user is not an admin but has permissions', async () => {
      const mockUser = {
        userId: 'mockUser',
        sessionId: null,
        expiration: null,
        clientIp: null,
        isAdmin: true,
        permissionSet: [
          {
            id: 3,
            permissions: ['DSMP'],
          },
        ],
      };
      const access = service.hasPermissions(mockUser, 3, 'MP');
      expect(access).toBe(true);
    });

    it('should return false given a user does not have permissions', async () => {
      const mockUser = {
        userId: 'mockUser',
        sessionId: null,
        expiration: null,
        clientIp: null,
        isAdmin: true,
        permissionSet: [
          {
            id: 3,
            permissions: ['DSQA'],
          },
        ],
      };
      const access = service.hasPermissions(mockUser, 3, 'MP');
      expect(access).toBe(true);
    });
  });

  describe('handleMpSubmission', () => {
    it('should call the dynamic submission record creation given monitor plans', async () => {
      jest.spyOn(service, 'hasPermissions').mockReturnValue(true);
      const mockInsertion = jest.fn().mockReturnValue(new Promise(() => {}));
      jest
        .spyOn(service, 'createDynamicSubmissionRecord')
        .mockImplementation(mockInsertion);

      const submissionItem = new SubmissionItem();
      submissionItem.submitMonPlan = true;

      const result = service.handleMpSubmission(
        0,
        resusableMockUser,
        0,
        0,
        submissionItem,
      );

      expect(result.length).toBe(1);
    });
  });

  describe('handleQASubmission', () => {
    it('should call the dynamic submission record creation given qa plans', async () => {
      jest.spyOn(service, 'hasPermissions').mockReturnValue(true);
      const mockInsertion = jest.fn().mockReturnValue(new Promise(() => {}));
      jest
        .spyOn(service, 'createDynamicSubmissionRecord')
        .mockImplementation(mockInsertion);

      const submissionItem = new SubmissionItem();
      submissionItem.qceIds = [{ id: 'Mock', quarter: '' }];
      submissionItem.teeIds = [{ id: 'Mock', quarter: '' }];
      submissionItem.testSumIds = [{ id: 'Mock', quarter: '' }];

      const result = service.handleQASubmission(
        0,
        resusableMockUser,
        0,
        0,
        submissionItem,
      );

      expect(result.length).toBe(3);
    });
  });

  describe('handleEmSubmission', () => {
    it('should call the dynamic submission record creation given em plans', async () => {
      jest.spyOn(service, 'hasPermissions').mockReturnValue(true);
      const mockInsertion = jest.fn().mockReturnValue(new Promise(() => {}));
      jest
        .spyOn(service, 'createDynamicSubmissionRecord')
        .mockImplementation(mockInsertion);

      const submissionItem = new SubmissionItem();
      submissionItem.emissionsReportingPeriods = ['mock', 'mock'];

      const result = service.handleEmSubmission(
        0,
        resusableMockUser,
        0,
        0,
        submissionItem,
      );

      expect(result.length).toBe(2);
    });
  });
});
