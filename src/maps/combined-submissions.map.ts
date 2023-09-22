import { Injectable } from '@nestjs/common';
import { BaseMap } from '@us-epa-camd/easey-common/maps';
import { CombinedSubmissions } from '../entities/combined-submissions.entity';
import { SubmissionsLastUpdatedDTO } from '../dto/submission-last-updated.dto';

@Injectable()
export class CombinedSubmissionsMap extends BaseMap<
  CombinedSubmissions,
  SubmissionsLastUpdatedDTO
> {
  public async one(
    entity: CombinedSubmissions,
  ): Promise<SubmissionsLastUpdatedDTO> {
    return {
      id: entity.submissionIdentifier,
      fileTypeCode: entity.processCode,
      severityCode: entity.severityCode,
      facId: entity.facIdentifier,
      submissionEndStateStageTime: entity.submissionEndStateStageTime,
      monitorPlanId: entity.monPlanIdentifier,
      reportPeriodId: entity.rptPeriodIdentifier,
      submissionSetId: entity.submissionSetIdentifier,
      lastUpdated: entity.submittedOn,
      userId: entity.userIdentifier,
    };
  }
}
