import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { EaseyException } from '@us-epa-camd/easey-common/exceptions';

import { UnitsExpectedToSubmitService } from './units-expected-to-submit.service';
import { UnitsExpectedParamsDTO } from '../dto/units-expected-params.dto';
import { UnitsExpectedDTO } from '../dto/units-expected.dto';
import { UnitsExpectedRepository } from './units-expected-to-submit.repository';
import { UnitsExpectedMap } from '../maps/units-expected.map';
import { UnitsExpectedView } from '../entities/units-expected-view.entity';

const genUnitsExpectedView = (count = 1): UnitsExpectedView[] => {
  const items: UnitsExpectedView[] = [];
  for (let i = 1; i <= count; i++) {
    const item = new UnitsExpectedView();
    item.facilityId = 3;
    item.facilityName = 'Barry';
    item.stateCode = 'AL';
    item.unitId = i.toString();
    item.locations = i.toString();
    item.submissionTypeDescription = i === 1 ? null : 'Initial';
    item.accessBeginDate = i === 1 ? null : new Date('2023-01-01');
    item.accessEndDate = i === 1 ? null : new Date('2023-03-31');
    item.windowStatus = i === 1 ? 'No Window' : 'Open';
    item.submissionStatus = i === 1 ? null : 'Pending';
    item.submissionId = i === 1 ? null : 12345 + i;
    item.submissionDate = i === 1 ? null : new Date('2023-01-15T10:30:00Z');
    item.severityDescription = i === 1 ? null : 'No Errors';
    items.push(item);
  }
  return items;
};

const genUnitsExpectedDTO = (count = 1): UnitsExpectedDTO[] => {
  const items: UnitsExpectedDTO[] = [];
  for (let i = 1; i <= count; i++) {
    items.push({
      facilityId: 3,
      facilityName: 'Barry',
      stateCode: 'AL',
      unitId: i.toString(),
      locations: i.toString(),
      submissionTypeDescription: i === 1 ? null : 'Initial',
      accessBeginDate: i === 1 ? null : new Date('2023-01-01'),
      accessEndDate: i === 1 ? null : new Date('2023-03-31'),
      windowStatus: i === 1 ? 'No Window' : 'Open',
      submissionStatus: i === 1 ? null : 'Pending',
      submissionId: i === 1 ? null : 12345 + i,
      submissionDate: i === 1 ? null : new Date('2023-01-15T10:30:00Z'),
      severityDescription: i === 1 ? null : 'No Errors',
    });
  }
  return items;
};

describe('UnitsExpectedToSubmitService', () => {
  let service: UnitsExpectedToSubmitService;
  let repository: jest.Mocked<UnitsExpectedRepository>;
  let map: jest.Mocked<UnitsExpectedMap>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsExpectedToSubmitService,
        {
          provide: UnitsExpectedRepository,
          useValue: {
            getUnitsExpectedToSubmit: jest.fn(),
          },
        },
        {
          provide: UnitsExpectedMap,
          useValue: {
            many: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UnitsExpectedToSubmitService);
    repository = module.get(UnitsExpectedRepository);
    map = module.get(UnitsExpectedMap);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUnitsExpectedToSubmit', () => {
    it('should successfully return mapped data from repository', async () => {
      const params = new UnitsExpectedParamsDTO();
      params.programCode = 'ARP';
      params.year = 2023;
      params.quarter = 1;

      const mockViewRecords = genUnitsExpectedView(2);
      const mockDTOs = genUnitsExpectedDTO(2);

      repository.getUnitsExpectedToSubmit.mockResolvedValue(mockViewRecords);
      map.many.mockResolvedValue(mockDTOs);

      const result = await service.getUnitsExpectedToSubmit(params);

      expect(result).toEqual(mockDTOs);
      expect(repository.getUnitsExpectedToSubmit).toHaveBeenCalledWith(params);
      expect(map.many).toHaveBeenCalledWith(mockViewRecords);
    });

    it('should return empty array when repository returns empty array', async () => {
      const params = new UnitsExpectedParamsDTO();
      params.programCode = 'ARP';
      params.year = 2023;
      params.quarter = 1;

      repository.getUnitsExpectedToSubmit.mockResolvedValue([]);
      map.many.mockResolvedValue([]);

      const result = await service.getUnitsExpectedToSubmit(params);

      expect(result).toEqual([]);
      expect(repository.getUnitsExpectedToSubmit).toHaveBeenCalledWith(params);
    });

    it('should throw EaseyException when repository throws error', async () => {
      const params = new UnitsExpectedParamsDTO();
      params.programCode = 'ARP';
      params.year = 2023;
      params.quarter = 1;

      const error = new Error('Database error');
      repository.getUnitsExpectedToSubmit.mockRejectedValue(error);

      await expect(service.getUnitsExpectedToSubmit(params)).rejects.toThrow(
        new EaseyException(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });

    it('should throw EaseyException when map throws error', async () => {
      const params = new UnitsExpectedParamsDTO();
      params.programCode = 'ARP';
      params.year = 2023;
      params.quarter = 1;

      const mockViewRecords = genUnitsExpectedView(1);
      repository.getUnitsExpectedToSubmit.mockResolvedValue(mockViewRecords);

      const error = new Error('Mapping error');
      map.many.mockRejectedValue(error);

      await expect(service.getUnitsExpectedToSubmit(params)).rejects.toThrow(
        new EaseyException(error, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });

    it('should handle repository returning records with null values', async () => {
      const params = new UnitsExpectedParamsDTO();
      params.programCode = 'ARP';
      params.year = 2023;
      params.quarter = 1;

      const mockViewRecords = genUnitsExpectedView(1); // First record has null values
      const mockDTOs = genUnitsExpectedDTO(1);

      repository.getUnitsExpectedToSubmit.mockResolvedValue(mockViewRecords);
      map.many.mockResolvedValue(mockDTOs);

      const result = await service.getUnitsExpectedToSubmit(params);

      expect(result).toHaveLength(1);
      expect(result[0].submissionId).toBeNull();
      expect(result[0].submissionTypeDescription).toBeNull();
      expect(result[0].accessBeginDate).toBeNull();
      expect(map.many).toHaveBeenCalledWith(mockViewRecords);
    });

    it('should pass all parameters correctly to repository', async () => {
      const params = new UnitsExpectedParamsDTO();
      params.facilityId = 3;
      params.facilityName = 'Barry';
      params.stateCode = 'AL';
      params.programCode = 'ARP';
      params.year = 2023;
      params.quarter = 1;
      params.windowStatus = 'Open';

      repository.getUnitsExpectedToSubmit.mockResolvedValue([]);
      map.many.mockResolvedValue([]);

      await service.getUnitsExpectedToSubmit(params);

      expect(repository.getUnitsExpectedToSubmit).toHaveBeenCalledWith(params);
    });
  });
});