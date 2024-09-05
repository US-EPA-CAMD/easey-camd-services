import { CheckCatalogService } from '@us-epa-camd/easey-common/check-catalog';
import { ErrorMessages } from '@us-epa-camd/easey-common/constants';
import { IsValidCode, IsValidDate } from '@us-epa-camd/easey-common/pipes';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidationArguments,
} from 'class-validator';
import { FindManyOptions, In } from 'typeorm';

import { CheckCatalogResult } from '../entities/check-catalog-result.entity';
import { EsMatchDataTypeCode } from '../entities/es-match-data-type-code.entity';
import { EsMatchTimeTypeCode } from '../entities/es-match-time-type-code.entity';
import { EsReasonCode } from '../entities/es-reason-code.entity';
import { MonitorLocation } from '../entities/monitor-location.entity';
import { Plant } from '../entities/plant.entity';
import { SeverityCode } from '../entities/severity-code.entity';
import { IsValidLocations } from '../pipes/is-valid-locations.pipe';

const msgA = `You reported an invalid [property] of [value]`;

export class ErrorSuppressionsPayloadDTO {
  @IsNotEmpty({
    message: () => {
      return ErrorMessages.RequiredProperty();
    },
  })
  @IsNumber()
  @IsValidCode(CheckCatalogResult, {
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(msgA, {
        property: args.property,
        value: args.value,
      });
    },
  })
  checkCatalogResultId: number;

  @IsNotEmpty({
    message: () => {
      return ErrorMessages.RequiredProperty();
    },
  })
  @IsString()
  @IsValidCode(SeverityCode, {
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(msgA, {
        property: args.property,
        value: args.value,
      });
    },
  })
  severityCode: string;

  @IsNumber()
  @IsValidCode(Plant, {
    message: (args: ValidationArguments) => {
      return `The ${args.property} is not valid. Refer to the list of available facilityRecordIds for valid values '/facilities-mgmt/facilities'`;
    },
  })
  @IsOptional()
  facilityId?: number;

  @IsString()
  @IsOptional()
  @IsValidLocations({
    message: (args: ValidationArguments) => {
      return `You have reported invalid locations of [${args.value}] for the facilityId [${args.object['facilityId']}].`;
    },
  })
  locations?: string;

  @IsString()
  @IsValidCode(EsMatchDataTypeCode, {
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(msgA, {
        property: args.property,
        value: args.value,
      });
    },
  })
  @IsOptional()
  matchDataTypeCode?: string;

  @IsString()
  @IsOptional()
  matchDataValue?: string;

  @IsString()
  @IsValidCode(EsMatchTimeTypeCode, {
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(msgA, {
        property: args.property,
        value: args.value,
      });
    },
  })
  @IsOptional()
  matchTimeTypeCode?: string;

  @IsValidDate({
    message: ErrorMessages.DateValidity(),
  })
  @IsDateString()
  @IsOptional()
  matchTimeBeginValue?: Date;

  @IsValidDate({
    message: ErrorMessages.DateValidity(),
  })
  @IsDateString()
  @IsOptional()
  matchTimeEndValue?: Date;

  @IsBoolean()
  @IsOptional()
  matchHistoricalIndicator?: boolean;

  @IsNotEmpty({
    message: () => {
      return ErrorMessages.RequiredProperty();
    },
  })
  @IsString()
  @IsValidCode(EsReasonCode, {
    message: (args: ValidationArguments) => {
      return CheckCatalogService.formatMessage(msgA, {
        property: args.property,
        value: args.value,
      });
    },
  })
  reasonCode: string;

  @IsNotEmpty({
    message: () => {
      return ErrorMessages.RequiredProperty();
    },
  })
  @IsString()
  note: string;
}
