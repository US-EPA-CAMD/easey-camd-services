import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { EntityManager } from 'typeorm';

import { BookmarkCreatedDTO } from '../dto/bookmark-created.dto';
import { Bookmark } from '../entities/bookmark.entity';
import { BookmarkMap } from '../maps/bookmark.map';
import { BookmarkRepository } from './bookmark.repository';
import { BookmarkService } from './bookmark.service';

const mockRepository = () => ({
  save: jest.fn(),
  create: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
});

const mockBookmark = (
  bookmarkId: number,
  bookmarkData: string,
  bookmarkAddDate: Date,
  bookmarkLastAccessedDate: Date,
  bookmarkHitCount: number,
) => {
  const bookmark = new Bookmark();
  bookmark.bookmarkId = bookmarkId;
  bookmark.bookmarkData = bookmarkData;
  bookmark.bookmarkAddDate = bookmarkAddDate;
  bookmark.bookmarkLastAccessedDate = bookmarkLastAccessedDate;
  bookmark.bookmarkHitCount = bookmarkHitCount;
  return bookmark;
};

describe('-- Bookmark Service --', () => {
  let service: BookmarkService;
  let repository: any;
  const bookmarkMap = new BookmarkMap();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        BookmarkMap,
        ConfigService,
        BookmarkService,
        EntityManager,
        {
          provide: BookmarkRepository,
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get(BookmarkService);
    repository = module.get(BookmarkRepository);
  });

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
      excludedColumns: ['co2MassMeasureFlg', 'co2Rate', 'co2RateMeasureFlg'],
    },
  };

  describe('createBookmark', () => {
    it('calls BookmarkRepository.save() and creates a new bookmark', async () => {
      const expectedEntity: Bookmark = new Bookmark();
      const expectedResult: BookmarkCreatedDTO = new BookmarkCreatedDTO();
      repository.create.mockReturnValue(expectedEntity);
      repository.save.mockResolvedValue(expectedResult);
      let result = await service.createBookmark(payload);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getBookmark', () => {
    it('calls BookmarkRepository.getBookmarkById() and gets bookmark by id', async () => {
      const bookmarkId = 1000;
      const bookmark = mockBookmark(
        bookmarkId,
        JSON.stringify(payload),
        new Date(),
        new Date(),
        5,
      );
      const results = await bookmarkMap.one(bookmark);
      repository.findOneBy.mockReturnValue(bookmark);
      expect(await service.getBookmarkById(bookmarkId)).toStrictEqual(results);
    });
  });
});
