import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import {
  ApportionedEmissionsQuarterlyDTO,
  ApportionedEmissionsStateDTO,
  ProgramCodeDTO,
  TimePeriodDTO,
} from '../dto/bulk-file-mass-generation.dto';
import { MassBulkFileService } from './mass-bulk-file.service';

describe('-- Mass Bulk File Service --', () => {
  let massBulkFileService: MassBulkFileService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [ConfigService, MassBulkFileService],
    }).compile();

    const mockGetmanagerImplementation = {
      find: jest.fn().mockImplementation((type) => {
        switch (type.name) {
          case 'StateCode':
            return [{ stateCode: 'MockState1' }];
          case 'ProgramCode':
            return [{ prgCode: 'ARP' }];
        }
      }),

      insert: jest.fn(),
    };

    massBulkFileService = module.get(MassBulkFileService);

    jest
      .spyOn(massBulkFileService, 'returnManager')
      .mockReturnValue(mockGetmanagerImplementation);
  });

  it('should be defined', async () => {
    expect(massBulkFileService).toBeDefined();
  });

  describe('getStateCodes', () => {
    it('Gets all valid state codes from database', async () => {
      const result = await massBulkFileService.getStateCodes([]);
      expect(result[0]).toEqual('MockState1');
    });

    it('Gets all valid state codes given an input array', async () => {
      const result = await massBulkFileService.getStateCodes(['AL']);
      expect(result[0]).toEqual('AL');
    });
  });

  describe('getProgramCodes', () => {
    it('Gets all valid program codes from database', async () => {
      const result = await massBulkFileService.getProgramCodes([]);
      expect(result[0]).toEqual('ARP');
    });

    it('Gets all valid program codes given an input array', async () => {
      const result = await massBulkFileService.getProgramCodes(['O2']);
      expect(result[0]).toEqual('O2');
    });
  });

  describe('getQuarterList', () => {
    it('Gets all valid quarters', () => {
      const result = massBulkFileService.getQuarterList([]);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('Gets all valid quarters provided an input array', () => {
      const result = massBulkFileService.getQuarterList([1, 2]);
      expect(result).toEqual([1, 2]);
    });
  });

  describe('createQuarterDates', () => {
    it('Get quarter dates quarter:1', () => {
      const result = massBulkFileService.getQuarterDates(1, 2020);
      expect(result.beginDate).toEqual('2020-01-01');
      expect(result.endDate).toEqual('2020-03-31');
    });

    it('Get quarter dates quarter:2', () => {
      const result = massBulkFileService.getQuarterDates(2, 2020);
      expect(result.beginDate).toEqual('2020-04-01');
      expect(result.endDate).toEqual('2020-06-30');
    });

    it('Get quarter dates quarter:3', () => {
      const result = massBulkFileService.getQuarterDates(3, 2020);
      expect(result.beginDate).toEqual('2020-07-01');
      expect(result.endDate).toEqual('2020-09-30');
    });

    it('Get quarter dates quarter:4', () => {
      const result = massBulkFileService.getQuarterDates(4, 2020);
      expect(result.beginDate).toEqual('2020-10-01');
      expect(result.endDate).toEqual('2020-12-31');
    });
  });

  describe('newJobLog', () => {
    it('Create basic record', () => {
      const result = massBulkFileService.newJobLog('Job');
      expect(result.jobName).toEqual('Job');
    });
  });

  describe('generateStateApportionedEmissions', () => {
    it('Insert 4 records into the queue for the given parameters', async () => {
      const paramDTO = new ApportionedEmissionsStateDTO();
      paramDTO.from = 2015;
      paramDTO.to = 2016;
      paramDTO.subTypes = ['Hourly'];
      paramDTO.generateStateMATS = true;

      const mockInsertion = jest.fn();

      jest
        .spyOn(massBulkFileService, 'getStateCodes')
        .mockResolvedValue(['AL']);

      jest
        .spyOn(massBulkFileService, 'returnManager')
        .mockReturnValue({ insert: mockInsertion });

      await massBulkFileService.generateStateApportionedEmissions(paramDTO);

      expect(mockInsertion).toHaveBeenCalledTimes(4);
    });
  });

  describe('generateQuarterApportionedEmissions', () => {
    it('Insert 4 records into the queue for the given parameters', async () => {
      const paramDTO = new ApportionedEmissionsQuarterlyDTO();
      paramDTO.from = 2015;
      paramDTO.to = 2016;
      paramDTO.subTypes = ['Hourly'];
      paramDTO.quarters = [1];
      paramDTO.generateQuarterMATS = true;

      const mockInsertion = jest.fn();

      jest
        .spyOn(massBulkFileService, 'returnManager')
        .mockReturnValue({ insert: mockInsertion });

      await massBulkFileService.generateQuarterApportionedEmissions(paramDTO);

      expect(mockInsertion).toHaveBeenCalledTimes(4);
    });
  });

  describe('generateFacility', () => {
    it('Insert 2 records into the queue for the given parameters', async () => {
      const paramDTO = new TimePeriodDTO();
      paramDTO.from = 2015;
      paramDTO.to = 2016;

      const mockInsertion = jest.fn();

      jest
        .spyOn(massBulkFileService, 'returnManager')
        .mockReturnValue({ insert: mockInsertion });

      await massBulkFileService.generateFacility(paramDTO);

      expect(mockInsertion).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateEmissionsCompliance', () => {
    it('Insert 1 record into the queue for the given parameters', async () => {
      const mockInsertion = jest.fn();

      jest
        .spyOn(massBulkFileService, 'returnManager')
        .mockReturnValue({ insert: mockInsertion });

      await massBulkFileService.generateEmissionsCompliance();

      expect(mockInsertion).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateAllowanceHoldings', () => {
    it('Insert 2 records into the queue for the given parameters', async () => {
      const paramDTO = new ProgramCodeDTO();
      paramDTO.programCodes = ['ARP', 'CO2'];

      const mockInsertion = jest.fn();

      jest
        .spyOn(massBulkFileService, 'getProgramCodes')
        .mockResolvedValue(['ARP', 'CO2']);

      jest
        .spyOn(massBulkFileService, 'returnManager')
        .mockReturnValue({ insert: mockInsertion });

      await massBulkFileService.generateAllowanceHoldings(paramDTO);

      expect(mockInsertion).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateAllowanceCompliance', () => {
    it('Insert 2 records into the queue for the given parameters', async () => {
      const paramDTO = new ProgramCodeDTO();
      paramDTO.programCodes = ['ARP', 'CO2'];

      const mockInsertion = jest.fn();

      jest
        .spyOn(massBulkFileService, 'getProgramCodes')
        .mockResolvedValue(['ARP', 'CO2']);

      jest
        .spyOn(massBulkFileService, 'returnManager')
        .mockReturnValue({ insert: mockInsertion });

      await massBulkFileService.generateAllowanceCompliance(paramDTO);

      expect(mockInsertion).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateAllowanceTransactions', () => {
    it('Insert 2 records into the queue for the given parameters', async () => {
      const paramDTO = new ProgramCodeDTO();
      paramDTO.programCodes = ['ARP', 'CO2'];

      const mockInsertion = jest.fn();

      jest
        .spyOn(massBulkFileService, 'getProgramCodes')
        .mockResolvedValue(['ARP', 'CO2']);

      jest
        .spyOn(massBulkFileService, 'returnManager')
        .mockReturnValue({ insert: mockInsertion });

      await massBulkFileService.generateAllowanceTransactions(paramDTO);

      expect(mockInsertion).toHaveBeenCalledTimes(2);
    });
  });
});
