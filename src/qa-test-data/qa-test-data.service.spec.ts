import { Test, TestingModule } from '@nestjs/testing';
import { QaTestDataService } from './qa-test-data.service';

describe('QaTestDataService', () => {
  let service: QaTestDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QaTestDataService],
    }).compile();

    service = module.get<QaTestDataService>(QaTestDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
