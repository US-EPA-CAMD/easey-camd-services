import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { EmissionsLastUpdatedDTO } from '../dto/submission-last-updated.dto';
import { EmissionEvaluationGlobal } from '../entities/emission-evaluation-global.entity';

@Injectable()
export class EmissionsLastUpdatedMap extends BaseMap<
  EmissionEvaluationGlobal,
  EmissionsLastUpdatedDTO
> {
  public async one(
    entity: EmissionEvaluationGlobal,
  ): Promise<EmissionsLastUpdatedDTO> {
    return {
      monitorPlanId: entity.monPlanIdentifier,
      reportPeriodId: entity.rptPeriodIdentifier,
      submissionId: entity.submissionIdentifier,
      lastUpdated: entity.lastUpdated,
    };
  }
}
