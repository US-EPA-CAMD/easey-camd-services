import { Test, TestingModule } from '@nestjs/testing';
import { EmSubmissionAccessService } from './em-submission-access.service';
import { EmSubmissionAccessViewRepository } from './em-submission-access-view.repository';
import {
  EmSubmissionAccessCreateDTO,
  EmSubmissionAccessDTO,
  EmSubmissionAccessUpdateDTO,
} from '../dto/em-submission-access.dto';
import { EmSubmissionAccessParamsDTO } from '../dto/em-submission-access.params.dto';
import { EmSubmissionAccessMap } from '../maps/em-submission-access.map';
import { EmSubmissionAccessRepository } from './em-submission-access.repository';
import { genEmSubmissionAccess } from '../../test/object-generators/em-submission-access';
import { EmSubmissionAccess } from '../entities/em-submission-access.entity';
import { EntityManager } from 'typeorm';

const mockViewRepository = () => ({
  getEmSubmissionAccess: jest.fn(),
  findOneBy: jest.fn(),
});

const mockRepository = () => ({
  save: jest.fn(),
  create: jest.fn().mockReturnValue(new EmSubmissionAccess()),
  findOneBy: jest.fn(),
});

const mockMap = () => ({
  many: jest.fn(),
  one: jest.fn(),
});

const mockEntityManager = () => ({
  query: jest.fn(),
});

describe('EmSubmissionAccessService', () => {
  let service: EmSubmissionAccessService;
  let viewRepository: any;
  let repository: any;
  let map: any;
  let entityManager: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmSubmissionAccessService,
        {
          provide: EmSubmissionAccessViewRepository,
          useFactory: mockViewRepository,
        },
        {
          provide: EmSubmissionAccessRepository,
          useFactory: mockRepository,
        },
        {
          provide: EmSubmissionAccessMap,
          useFactory: mockMap,
        },
        {
          provide: EntityManager,
          useFactory: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get(EmSubmissionAccessService);
    viewRepository = module.get(EmSubmissionAccessViewRepository);
    repository = module.get(EmSubmissionAccessRepository);
    map = module.get(EmSubmissionAccessMap);
    entityManager = module.get(EntityManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully return ONLY no-window records when status is "NO WINDOW"', async () => {
    const mockedNoWindowRecords = [
      {
        em_sub_accessId: 1,
        fac_id: 100,
        facility_name: 'Test Facility',
        oris_code: 12345,
        state: 'TX',
        locations: 'Test Location',
        mon_plan_id: 'MP123',
        report_freq_cd: 'Q',
        period_abbreviation: '2024 Q1',
        em_sub_type_cd_description: 'Test Type',
        em_sub_type_cd: 'TEST',
        submission_id: null,
        severity_cd: null,
        userid: 'testUser',
      },
    ];
  
    const expectedNoWindowDTOs = mockedNoWindowRecords.map(row => ({
      id: row.em_sub_accessId,
      facilityId: row.fac_id,
      facilityName: row.facility_name,
      orisCode: row.oris_code,
      state: row.state,
      locations: row.locations,
      monitorPlanId: row.mon_plan_id,
      reportingFrequencyCode: row.report_freq_cd,
      reportingPeriodAbbreviation: row.period_abbreviation,
      submissionTypeDescription: row.em_sub_type_cd_description,
      submissionTypeCode: row.em_sub_type_cd,
      status: 'NO WINDOW',
      lastSubmissionId: row.submission_id,
      severityLevel: row.severity_cd,
      userid: row.userid,
      addDate: null,
      updateDate: null,
    }));
  
    // Ensure the repository call is NOT made
    map.many.mockReturnValue([]); // Shouldn't be called
    entityManager.query.mockResolvedValue(mockedNoWindowRecords);
  
    let filters = new EmSubmissionAccessParamsDTO();
    filters.status = 'NO WINDOW';
    filters.orisCode = 12345;
    filters.year = 2024;
    filters.quarter = 1;
  
    let result = await service.getEmSubmissionAccess(filters);
  
    expect(result).toEqual(expectedNoWindowDTOs);
    expect(viewRepository.getEmSubmissionAccess).not.toHaveBeenCalled();
    expect(entityManager.query).toHaveBeenCalledWith(
      `SELECT * FROM camdecmpsaux.get_em_submission_access_no_window_view($1, $2, $3)`,
      [filters.orisCode, filters.year, filters.quarter]
    );
  });

  it('should return both no-window records and view records when status is undefined', async () => {
    const mockedViewRecords = [
      {
        id: 61835,
        facilityId: 86821,
        facilityName: "Mock Facility",
        orisCode: 21352,
        state: "TX",
        locations: "Mock Location",
        monitorPlanId: "MP123",
        reportingFrequencyCode: "Q",
        reportingPeriodAbbreviation: "2024 Q1",
        submissionTypeDescription: "Mock Type",
        submissionTypeCode: "TEST",
        status: "APPROVED",
        lastSubmissionId: 60562,
        severityLevel: "High",
        userid: "mockUser",
        addDate: new Date("2037-04-13T04:29:22.737Z"),
        updateDate: new Date("2097-11-17T08:28:06.384Z"),
        openDate: null,
        reportingPeriodId: 0,
        emissionStatusCode: '',
        submissionAvailabilityCode: '',
        resubExplanation: '',
        closeDate: null
      }
    ];
  
    const mockedNoWindowRecords = [
      {
        em_sub_accessId: 1,
        fac_id: 100,
        facility_name: 'Test Facility',
        oris_code: 12345,
        state: 'TX',
        locations: 'Test Location',
        mon_plan_id: 'MP123',
        report_freq_cd: 'Q',
        period_abbreviation: '2024 Q1',
        em_sub_type_cd_description: 'Test Type',
        em_sub_type_cd: 'TEST',
        submission_id: null,
        severity_cd: null,
        userid: 'testUser',
      },
    ];
  
    const expectedNoWindowDTOs = mockedNoWindowRecords.map(row => ({
      id: row.em_sub_accessId,
      facilityId: row.fac_id,
      facilityName: row.facility_name,
      orisCode: row.oris_code,
      state: row.state,
      locations: row.locations,
      monitorPlanId: row.mon_plan_id,
      reportingFrequencyCode: row.report_freq_cd,
      reportingPeriodAbbreviation: row.period_abbreviation,
      submissionTypeDescription: row.em_sub_type_cd_description,
      submissionTypeCode: row.em_sub_type_cd,
      status: 'NO WINDOW',
      lastSubmissionId: row.submission_id,
      severityLevel: row.severity_cd,
      userid: row.userid,
      addDate: null,
      updateDate: null,
    }));
  
    map.many.mockReturnValue(mockedViewRecords);
    entityManager.query.mockResolvedValue(mockedNoWindowRecords);
  
    let filters = new EmSubmissionAccessParamsDTO();
    filters.status = undefined;
    filters.orisCode = 12345;
    filters.year = 2024;
    filters.quarter = 1;
  
    let result = await service.getEmSubmissionAccess(filters);
  
    expect(result).toEqual([...mockedViewRecords, ...expectedNoWindowDTOs]);
    expect(viewRepository.getEmSubmissionAccess).toHaveBeenCalledWith(filters);
    expect(entityManager.query).toHaveBeenCalledWith(
      `SELECT * FROM camdecmpsaux.get_em_submission_access_no_window_view($1, $2, $3)`,
      [filters.orisCode, filters.year, filters.quarter]
    );
  });

  it('should successfully return data only from EmSubmissionAccessViewRepository when status is not NO WINDOW', async () => {
    const mockedViewRecords = genEmSubmissionAccess<EmSubmissionAccessDTO>();
    map.many.mockReturnValue(mockedViewRecords);
    entityManager.query.mockResolvedValue([]);

    let filters = new EmSubmissionAccessParamsDTO();
    filters.status = 'APPROVED';
    filters.orisCode = 12345;
    filters.year = 2024;
    filters.quarter = 1;

    let result = await service.getEmSubmissionAccess(filters);

    expect(result).toEqual(mockedViewRecords);
    expect(viewRepository.getEmSubmissionAccess).toHaveBeenCalledWith(filters);
    expect(entityManager.query).not.toHaveBeenCalled();
  });

  it('calls EmSubmissionAccessRepository.createEmSubmissionAccess() and creates an emission submission access record', async () => {
    const mockedDto = genEmSubmissionAccess<EmSubmissionAccessDTO>()[0];
    map.one.mockReturnValue(mockedDto);
    let payload = new EmSubmissionAccessCreateDTO();
    viewRepository.findOneBy.mockResolvedValue(new EmSubmissionAccess());
    const result = await service.createEmSubmissionAccess(payload, 'user');
    expect(result).toEqual(mockedDto);
  });

  it('calls EmSubmissionAccessRepository.updateEmSubmissionAccess() and updates an emission submission access record', async () => {
    const mockedDto = genEmSubmissionAccess<EmSubmissionAccessDTO>()[0];
    map.one.mockReturnValue(mockedDto);
    let payload = new EmSubmissionAccessUpdateDTO();
    repository.findOneBy.mockResolvedValue(new EmSubmissionAccess());
    const result = await service.updateEmSubmissionAccess(
      mockedDto.id,
      payload,
    );
    expect(result).toEqual(mockedDto);
  });
});
