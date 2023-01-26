import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';

import { EsSpec } from '../entities/es-spec.entity';
import { ErrorSuppressionsDTO } from '../dto/error-suppressions-dto';

@Injectable()
export class ErrorSuppressionsMap extends BaseMap<
  EsSpec,
  ErrorSuppressionsDTO
> {
  public async one(entity: EsSpec): Promise<ErrorSuppressionsDTO> {
    return {
      id: entity.id,
      checkCatalogResultId: entity.checkCatalogResultId,
      checkTypeCode: entity.checkCatalogResult?.checkCatalog?.checkTypeCode,
      checkNumber: entity.checkCatalogResult?.checkCatalog?.checkNumber,
      checkResultCode: entity.checkCatalogResult?.checkResult,
      severityCode: entity.severityCode,
      facilityId: entity.facilityId,
      orisCode: entity?.plant?.orisCode,
      locations: entity.locationNameList,
      matchDataTypeCode: entity.matchDataTypeCode,
      matchDataValue: entity.matchDataValue,
      matchTimeTypeCode: entity.matchTimeTypeCode,
      matchTimeBeginValue: entity.matchTimeBeginValue,
      matchTimeEndValue: entity.matchTimeEndValue,
      matchHistoricalIndicator:
        entity.matchHistoricalInd === null
          ? null
          : !!+entity.matchHistoricalInd,
      reasonCode: entity.reasonCode,
      note: entity.note,
      active: !!+entity.activeInd,
      userId: entity.userId,
      addDate: entity.addDate,
      updateDate: entity.updateDate,
    };
  }
}
