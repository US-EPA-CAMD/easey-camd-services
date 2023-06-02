import { Test, TestingModule } from '@nestjs/testing';
import { QaTestSummaryService } from './qa-test-summary.service';

describe('QaTestSummaryService', () => {
  let service: QaTestSummaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QaTestSummaryService],
    }).compile();

    service = module.get<QaTestSummaryService>(QaTestSummaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
