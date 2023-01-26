import { EntityRepository, Repository } from 'typeorm';

import { EsSpec } from '../entities/es-spec.entity';
import { ErrorSuppressionsParamsDTO } from '../dto/error-suppressions.params.dto';
import { QueryBuilderHelper } from '../utils/query-builder.helper';

@EntityRepository(EsSpec)
export class ErrorSuppressionsRepository extends Repository<EsSpec> {
  async getErrorSuppressions(
    params: ErrorSuppressionsParamsDTO,
  ): Promise<EsSpec[]> {
    const {
      checkTypeCode,
      checkNumber,
      checkResult,
      severityCode,
      facilityId,
      locations,
      reasonCode,
      beginDateHrQtr,
      endDateHrQtr,
      active,
    } = params;
    let query = this.createQueryBuilder('es')
      .select([
        'es.id',
        'es.checkCatalogResultId',
        'cc.checkTypeCode',
        'cc.checkNumber',
        'ccr.checkResult',
        'es.severityCode',
        'es.facilityId',
        'p.orisCode',
        'es.locationNameList',
        'es.matchDataTypeCode',
        'es.matchDataValue',
        'es.matchTimeTypeCode',
        'es.matchTimeBeginValue',
        'es.matchTimeEndValue',
        'es.matchHistoricalInd',
        'es.reasonCode',
        'es.note',
        'es.activeInd',
        'es.userId',
        'es.addDate',
        'es.updateDate',
      ])
      .leftJoin('es.checkCatalogResult', 'ccr')
      .leftJoin('es.plant', 'p')
      .leftJoin('ccr.checkCatalog', 'cc');

    if (checkTypeCode) {
      query.andWhere('UPPER(cc.checkTypeCode) = :checkTypeCode', {
        checkTypeCode: checkTypeCode.toUpperCase(),
      });
    }
    if (checkNumber) {
      query.andWhere('cc.checkNumber = :checkNumber', {
        checkNumber: checkNumber,
      });
    }
    if (checkResult) {
      query.andWhere('UPPER(ccr.checkResult) = :checkResult', {
        checkResult: checkResult.toUpperCase(),
      });
    }
    if (severityCode) {
      query.andWhere('UPPER(es.severityCode) = :severityCode', {
        severityCode: severityCode.toUpperCase(),
      });
    }
    if (facilityId) {
      query.andWhere('p.orisCode = :facilityId', {
        facilityId: facilityId,
      });
    }
    if (locations) {
      query = QueryBuilderHelper.whereLocations(query, locations, 'es');
    }
    if (reasonCode) {
      query.andWhere('UPPER(es.reasonCode) = :reasonCode', {
        reasonCode: reasonCode.toUpperCase(),
      });
    }
    if (beginDateHrQtr) {
      query = QueryBuilderHelper.beginDateHrQtr(query, beginDateHrQtr);
    }
    if (endDateHrQtr) {
      query = QueryBuilderHelper.endDateHrQtr(query, endDateHrQtr);
    }

    if (String(active) === String(true)) {
      query.andWhere('es.activeInd = 1', {
        active: active,
      });
    } else if (String(active) === String(false)) {
      query.andWhere('es.activeInd = 0', {
        active: active,
      });
    }
    query.addOrderBy('es.id');
    return query.getMany();
  }
}
