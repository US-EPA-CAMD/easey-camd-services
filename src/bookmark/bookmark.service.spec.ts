import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';

import { ConfigService } from '@nestjs/config';
import { BookmarkService } from './bookmark.service';
import { BookmarkRepository } from './bookmark.repository';
import { Bookmark } from '../entities/bookmark.entity';
import { BookmarkCreatedDTO } from '../dto/bookmark-created.dto';

const mockRepository = () => ({
  save: jest.fn(),
  create: jest.fn(),
});

describe('-- Bookmark Service --', () => {
  let service: BookmarkService;
  let repository: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        ConfigService,
        BookmarkService,
        {
          provide: BookmarkRepository,
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get(BookmarkService);
    repository = module.get(BookmarkRepository);
  });

  describe('createBookmark', () => {
    it('calls BookmarkRepository.save() and creates a new bookmark', async () => {
      const expectedEntity: Bookmark = new Bookmark();
      const expectedResult: BookmarkCreatedDTO = new BookmarkCreatedDTO();
      repository.create.mockReturnValue(expectedEntity);
      repository.save.mockResolvedValue(expectedResult);
      let payload = {
        dataType: 'EMISSIONS',
        dataSubType: 'Hourly Emissions',
        filters: {
          timePeriod: {
            startDate: '2019-01-01',
            endDate: '2019-01-01',
            opHrsOnly: true,
          },
          program: {
            selected: ['ARP', 'CAIRNOX'],
            enabled: ['ARP', 'CAIRNOX', 'CSNOX', 'RGGI'],
          },
          facility: {
            selected: [3, 10],
            enabled: [3, 10, 26, 50],
          },
          unitType: {
            selected: ['AF', 'CFB'],
            enabled: ['AF', 'CFB', 'WBF', 'PFB'],
          },
          fuelType: {
            selected: [],
            enabled: ['CRF', 'PTC', 'LPG', 'PNG'],
          },
          stateTerritory: {
            selected: ['DC'],
            enabled: ['DC', 'AK', 'CA', 'MN'],
          },
          controlTechnology: {
            selected: ['APAC', 'CAT'],
            enabled: ['APAC', 'CAT', 'HPAC', 'REAC', 'UPAC'],
          },
        },
        dataPreview: {
          rendered: true,
          excludedColumns: [
            'co2MassMeasureFlg',
            'co2Rate',
            'co2RateMeasureFlg',
          ],
        },
      };
      let result = await service.createBookmark(payload);
      expect(result).toEqual(expectedResult);
    });
  });
});
