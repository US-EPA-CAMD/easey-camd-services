
    import { Injectable } from '@nestjs/common';
    import { BaseMap } from '@us-epa-camd/easey-common/maps';
    import { QaCertEvent } from '../entities/qa-cert-event.entity';
    import { QaCertEventDTO } from '../dto/qa-cert-event.dto';
    
    @Injectable()
    export class QaCertEventMap extends BaseMap<QaCertEvent, QaCertEventDTO> {
      public async one(entity: QaCertEvent): Promise<QaCertEventDTO> {
        return {
          monLOCIdentifier: entity.monLOCIdentifier,
monSystemIdentifier: entity.monSystemIdentifier,
componentIdentifier: entity.componentIdentifier,
qaCertEventCode: entity.qaCertEventCode,
qaCertEventDate: entity.qaCertEventDate,
qaCertEventHour: entity.qaCertEventHour,
requiredTestCode: entity.requiredTestCode,
conditionalDataBeginDate: entity.conditionalDataBeginDate,
conditionalDataBeginHour: entity.conditionalDataBeginHour,
lastTestCompletedDate: entity.lastTestCompletedDate,
lastTestCompletedHour: entity.lastTestCompletedHour,
lastUpdated: entity.lastUpdated,
updatedStatusFLG: entity.updatedStatusFLG,
needsEvalFLG: entity.needsEvalFLG,
chkSessionIdentifier: entity.chkSessionIdentifier,
userid: entity.userid,
addDate: entity.addDate,
updateDate: entity.updateDate,
qaCertEventIdentifier: entity.qaCertEventIdentifier,
submissionIdentifier: entity.submissionIdentifier,
submissionAvailabilityCode: entity.submissionAvailabilityCode,
pendingStatusCode: entity.pendingStatusCode,
evalStatusCode: entity.evalStatusCode,

        };
      }
    }
    