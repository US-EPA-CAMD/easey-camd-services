import { Test, TestingModule } from '@nestjs/testing';
import { QaCertEventService } from './qa-cert-event.service';

describe('QaCertEventService', () => {
  let service: QaCertEventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QaCertEventService],
    }).compile();

    service = module.get<QaCertEventService>(QaCertEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
