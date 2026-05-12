import { Test } from '@nestjs/testing';
import { EntityManager } from 'typeorm';

import { UnitsExpectedParamsDTO } from '../dto/units-expected-params.dto';
import { UnitsExpectedRepository } from './units-expected-to-submit.repository';
import { UnitsExpectedView } from '../entities/units-expected-view.entity';

describe('UnitsExpectedRepository', () => {
  let repository: UnitsExpectedRepository;
  let entityManager: EntityManager;

  const mockQueryResult = [
    {
      oris_code: 3,
      facility_name: 'Barry',
      state: 'AL',
      unitid: '5',
      locations: '5',
      em_sub_type_cd_description: null,
      access_begin_date: null,
      access_end_date: null,
      window_status: 'No Window',
      submission_status: null,
      submission_id: null,
      submission_date: null,
      severity_cd_description: null,
    },
    {
      oris_code: 3,
      facility_name: 'Barry',
      state: 'AL',
      unitid: '6',
      locations: '6',
      em_sub_type_cd_description: 'Initial',
      access_begin_date: '2023-01-01',
      access_end_date: '2023-03-31',
      window_status: 'Open',
      submission_status: 'Pending',
      submission_id: 12345,
      submission_date: '2023-01-15T10:30:00Z',
      severity_cd_description: 'No Errors',
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UnitsExpectedRepository,
        {
          provide: EntityManager,
          useValue: {
            query: jest.fn().mockResolvedValue(mockQueryResult),
          },
        },
      ],
    }).compile();

    repository = module.get(UnitsExpectedRepository);
    entityManager = module.get(EntityManager);
  });

  describe('getUnitsExpectedToSubmit', () => {
    it('should call the database function with correct parameters', async () => {
      const params = new UnitsExpectedParamsDTO();
      params.facilityId = 3;
      params.facilityName = 'Barry';
      params.stateCode = 'AL';
      params.programCode = 'ARP';
      params.year = 2023;
      params.quarter = 1;
      params.windowStatus = 'Open';

      const spy = jest.spyOn(entityManager, 'query');

      await repository.getUnitsExpectedToSubmit(params);

      expect(spy).toHaveBeenCalledWith(
        `SELECT * FROM camdecmpsaux.get_units_expected_to_submit_report_data(
        $1, $2, $3, $4, $5, $6, $7
      )`,
        [3, 'Barry', 'AL', 'ARP', 2023, 1, 'Open'],
      );
    });

    it('should call the database function with null for optional parameters', async () => {
      const params = new UnitsExpectedParamsDTO();
      params.programCode = 'ARP';
      params.year = 2023;
      params.quarter = 1;

      const spy = jest.spyOn(entityManager, 'query');

      await repository.getUnitsExpectedToSubmit(params);

      expect(spy).toHaveBeenCalledWith(
        `SELECT * FROM camdecmpsaux.get_units_expected_to_submit_report_data(
        $1, $2, $3, $4, $5, $6, $7
      )`,
        [null, null, null, 'ARP', 2023, 1, null],
      );
    });

    it('should map database rows to entity instances', async () => {
      const params = new UnitsExpectedParamsDTO();
      params.programCode = 'ARP';
      params.year = 2023;
      params.quarter = 1;

      const result = await repository.getUnitsExpectedToSubmit(params);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UnitsExpectedView);
      expect(result[0].facilityId).toBe(3);
      expect(result[0].facilityName).toBe('Barry');
      expect(result[0].stateCode).toBe('AL');
      expect(result[0].unitId).toBe('5');
      expect(result[0].windowStatus).toBe('No Window');
      
      expect(result[1]).toBeInstanceOf(UnitsExpectedView);
      expect(result[1].facilityId).toBe(3);
      expect(result[1].unitId).toBe('6');
      expect(result[1].submissionId).toBe(12345);
      expect(result[1].submissionStatus).toBe('Pending');
    });

    it('should handle null values in the result correctly', async () => {
      jest.spyOn(entityManager, 'query').mockResolvedValue([
        {
          oris_code: 3,
          facility_name: 'Barry',
          state: 'AL',
          unitid: '5',
          locations: '5',
          em_sub_type_cd_description: null,
          access_begin_date: null,
          access_end_date: null,
          window_status: 'No Window',
          submission_status: null,
          submission_id: null,
          submission_date: null,
          severity_cd_description: null,
        },
      ]);

      const params = new UnitsExpectedParamsDTO();
      params.programCode = 'ARP';
      params.year = 2023;
      params.quarter = 1;

      const result = await repository.getUnitsExpectedToSubmit(params);

      expect(result).toHaveLength(1);
      expect(result[0].submissionId).toBeNull();
      expect(result[0].submissionDate).toBeNull();
      expect(result[0].severityDescription).toBeNull();
    });

    it('should return empty array when no results found', async () => {
      jest.spyOn(entityManager, 'query').mockResolvedValue([]);

      const params = new UnitsExpectedParamsDTO();
      params.programCode = 'ARP';
      params.year = 2023;
      params.quarter = 1;

      const result = await repository.getUnitsExpectedToSubmit(params);

      expect(result).toEqual([]);
    });
  });
});