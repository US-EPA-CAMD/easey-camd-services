import { Test, TestingModule } from '@nestjs/testing';
import { QaTestExtensionExemptionController } from './qa-test-extension-exemption.controller';
import { QaTestExtensionExemptionService } from './qa-test-extension-exemption.service';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '@us-epa-camd/easey-common/logger';
import { ConfigService } from '@nestjs/config';

describe('QaTestExtensionExemptionController', () => {
  let controller: QaTestExtensionExemptionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, LoggerModule],
      controllers: [QaTestExtensionExemptionController],
      providers: [QaTestExtensionExemptionService, ConfigService],
    }).compile();

    controller = module.get<QaTestExtensionExemptionController>(
      QaTestExtensionExemptionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
