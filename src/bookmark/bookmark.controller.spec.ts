import { Test } from '@nestjs/testing';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';

import { BookmarkRepository } from './bookmark.repository';
import { BookmarkController } from './bookmark.controller';
import { BookmarkService } from './bookmark.service';
import { BookmarkCreatedDTO } from '../dto/bookmark-created.dto';
import { BoomarkPayloadDTO } from '../dto/bookmark-payload.dto';

describe('-- Bookmark Controller --', () => {
  let controller: BookmarkController;
  let service: BookmarkService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      controllers: [BookmarkController],
      providers: [BookmarkRepository, BookmarkService],
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
});
