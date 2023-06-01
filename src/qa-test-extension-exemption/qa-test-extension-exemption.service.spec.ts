import { Test, TestingModule } from '@nestjs/testing';
import { QaTestExtensionExemptionService } from './qa-test-extension-exemption.service';

describe('QaTestExtensionExemptionService', () => {
  let service: QaTestExtensionExemptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QaTestExtensionExemptionService],
    }).compile();

    service = module.get<QaTestExtensionExemptionService>(QaTestExtensionExemptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
