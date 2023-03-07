import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';

import { EsSpec } from '../entities/es-spec.entity';
import { ErrorSuppressionsDTO } from '../dto/error-suppressions.dto';

@Injectable()
export class ErrorSuppressionsMap extends BaseMap<
  EsSpec,
  ErrorSuppressionsDTO
> {
  public async one(entity: EsSpec): Promise<ErrorSuppressionsDTO> {
    return {
      id: +entity.id,
      checkCatalogResultId: entity.checkCatalogResultId,
      checkTypeCode:
        entity.checkCatalogResult?.checkCatalog?.checkTypeCode ?? null,
      checkNumber: entity.checkCatalogResult?.checkCatalog?.checkNumber ?? null,
      checkResultCode: entity.checkCatalogResult?.checkResult ?? null,
      severityCode: entity.severityCode,
      facilityId: entity.facilityId,
      orisCode: entity?.plant?.orisCode ?? null,
      locations: entity.locations,
      matchDataTypeCode: entity.matchDataTypeCode,
      matchDataValue: entity.matchDataValue,
      matchTimeTypeCode: entity.matchTimeTypeCode,
      matchTimeBeginValue: entity.matchTimeBeginValue,
      matchTimeEndValue: entity.matchTimeEndValue,
      matchHistoricalIndicator:
        entity.matchHistoricalIndicator === null
          ? null
          : !!+entity.matchHistoricalIndicator,
      reasonCode: entity.reasonCode,
      note: entity.note,
      active: !!+entity.active,
      userId: entity.userId,
      addDate: entity.addDate,
      updateDate: entity.updateDate,
    };
  }
}
