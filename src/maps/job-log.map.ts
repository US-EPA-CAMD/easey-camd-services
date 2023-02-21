
    import { Injectable } from '@nestjs/common';
    import { BaseMap } from '@us-epa-camd/easey-common/maps';
    import { JobLog } from '../entities/job-log.entity';
    import { JobLogDTO } from '../dto/job-log.dto';
    
    @Injectable()
    export class JobLogMap extends BaseMap<JobLog, JobLogDTO> {
      public async one(entity: JobLog): Promise<JobLogDTO> {
        return {
          jobIdentifier: entity.jobIdentifier,
jobSystem: entity.jobSystem,
jobClass: entity.jobClass,
jobName: entity.jobName,
startDate: entity.startDate,
endDate: entity.endDate,
year: entity.year,
quarter: entity.quarter,
stateCode: entity.stateCode,
dataType: entity.dataType,
subType: entity.subType,
url: entity.url,
fileName: entity.fileName,
programCode: entity.programCode,
additionalDetails: entity.additionalDetails,
addDate: entity.addDate,
statusCode: entity.statusCode,

        };
      }
    }
    