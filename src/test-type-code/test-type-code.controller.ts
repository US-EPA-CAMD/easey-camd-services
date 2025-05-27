import { TestTypeCodeService } from './test-type-code.service';
import { TestTypeCode } from '../entities/test-type-code.entity';
import {
  Get
} from '@nestjs/common/decorators';
import { ArrayResponse } from '@us-epa-camd/easey-common/interfaces/common.interface';
import { Controller } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

// Endpoint needs to be funtional but not part of swagger
@ApiExcludeController()
@Controller('test-type-code')
export class TestTypeCodeController {
  constructor(private readonly testTypeCodeService: TestTypeCodeService) {}

  @Get()
  async findAll(): Promise<ArrayResponse<TestTypeCode>> {
    return {
      items : await this.testTypeCodeService.findAll()
    }; 
  }
}