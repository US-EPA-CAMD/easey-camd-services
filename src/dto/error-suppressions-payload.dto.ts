import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidationArguments,
} from 'class-validator';
import { CheckCatalogService } from '@us-epa-camd/easey-common/check-catalog';
import { ErrorMessages } from '@us-epa-camd/easey-common/constants';
import { IsValidCode, IsValidDate } from '@us-epa-camd/easey-common/pipes';
import { Plant } from '../entities/plant.entity';
import { EsReasonCode } from '../entities/es-reason-code.entity';
import { CheckCatalogResult } from '../entities/check-catalog-result.entity';
import { SeverityCode } from '../entities/severity-code.entity';
import { EsMatchDataTypeCode } from '../entities/es-match-data-type-code.entity';
import { EsMatchTimeTypeCode } from '../entities/es-match-time-type-code.entity';
import { IsValidCodes } from '../pipes/is-valid-codes.pipe';
import { MonitorLocation } from '../entities/monitor-location.entity';
import { FindOneOptions, In } from 'typeorm';

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
  @IsValidCodes(
    MonitorLocation,
    (args: ValidationArguments): FindOneOptions<MonitorLocation> => {
      const locations = args.value.split(',').map((item) => item.trim());
      return {
        where: {
          unit: {
            plant: {
              orisCode: args.object['facilityId'],
            },
          },
          stackPipe: {
            plant: {
              orisCode: args.object['facilityId'],
            },
          },
          monLocIdentifier: In(locations),
        },
        relations: ['unit', 'stackPipe'],
      };
    },
    {
      message: (args: ValidationArguments) => {
        return `You have reported invalid locations for the facilityId [${args.object['facilityId']}].`;
      },
    },
  )
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
