import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';

import { BookmarkRepository } from './bookmark.repository';
import { BookmarkController } from './bookmark.controller';
import { BookmarkService } from './bookmark.service';
import { BookmarkCreatedDTO } from '../dto/bookmark-created.dto';
import { BoomarkPayloadDTO } from '../dto/bookmark-payload.dto';
import { BookmarkMap } from '../maps/bookmark.map';
import { BookmarkDTO } from '../dto/bookmark.dto';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

jest.mock('@us-epa-camd/easey-common/guards');

describe('-- Bookmark Controller --', () => {
  let controller: BookmarkController;
  let service: BookmarkService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule, HttpModule],
      controllers: [BookmarkController],
      providers: [
        BookmarkMap,
        BookmarkRepository,
        BookmarkService,
        ConfigService,
      ],
    }).compile();

    controller = module.get(BookmarkController);
    service = module.get(BookmarkService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('* createBookmark', () => {
    it('should return a bookmark', async () => {
      const expectedResult: BookmarkCreatedDTO = new BookmarkCreatedDTO();
      const payloadDto = new BoomarkPayloadDTO();
      jest.spyOn(service, 'createBookmark').mockResolvedValue(expectedResult);
      expect(await controller.createBookmark(payloadDto)).toBe(expectedResult);
    });
  });

  describe('* getBookmarkById', () => {
    it('should return a single bookmark', async () => {
      const expectedResult = new BookmarkDTO();
      jest.spyOn(service, 'getBookmarkById').mockResolvedValue(expectedResult);
      expect(await controller.getBookmarkById(1000)).toBe(expectedResult);
    });
  });
});
