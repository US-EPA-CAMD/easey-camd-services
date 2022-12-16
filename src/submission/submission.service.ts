import { getManager } from 'typeorm';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { SubmissionsDTO } from '../dto/submission.dto';
import { LoggingException } from '@us-epa-camd/easey-common/exceptions';
import { SubmissionSet } from '../entities/submission-set.entity';
import SubmissionBuilder from './submission-builder.service';
import { MonitorPlan } from '../entities/monitor-plan.entity';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces/current-user.interface';
import { Plant } from '../entities/plant.entity';

@Injectable()
export class SubmissionService {
  constructor(
    private readonly logger: Logger,
    private readonly submissionBuilder: SubmissionBuilder,
  ) {}

  returnManager() {
    return getManager();
  }

  async handleSubmission(
    user: CurrentUser,
    dto: SubmissionsDTO,
  ): Promise<boolean> {
    try {
      const promises = [];

      for (const item of dto.items) {
        promises.push(
          new Promise(async (resolve) => {
            try {
              // Create Submission Set Record
              const submissionSet = new SubmissionSet();
              submissionSet.activityId = dto.activityId;
              submissionSet.addDate = new Date();
              submissionSet.monPlanId = item.monPlanId;
              submissionSet.userId = user.userId;
              const monitorPlan = await this.returnManager().findOne(
                MonitorPlan,
                item.monPlanId,
              );
              submissionSet.facId = monitorPlan.facId;
              const plant = await this.returnManager().findOne(
                Plant,
                monitorPlan.facId,
              );

              await this.returnManager().insert(SubmissionSet, submissionSet);

              // Get Just added Submission Set Auto-Generated Id
              const submissionSetId = (
                await this.returnManager().findOne(SubmissionSet, {
                  where: {
                    activityId: dto.activityId,
                    monPlanId: item.monPlanId,
                  },
                })
              ).id;

              // Create nested structure of promises to load all submission records for one submission set
              const innerPromises = [];
              innerPromises.push(
                ...this.submissionBuilder.handleMpSubmission(
                  submissionSetId,
                  user,
                  monitorPlan.facId,
                  plant.orisCode,
                  item,
                ),
              );

              innerPromises.push(
                ...this.submissionBuilder.handleQASubmission(
                  submissionSetId,
                  user,
                  monitorPlan.facId,
                  plant.orisCode,
                  item,
                ),
              );

              innerPromises.push(
                ...this.submissionBuilder.handleEmSubmission(
                  submissionSetId,
                  user,
                  monitorPlan.facId,
                  plant.orisCode,
                  item,
                ),
              );

              // Await all inner promises [Mp, Qa records, em records] to resolve then resolve the outer promise
              await Promise.all(innerPromises);
              resolve(true);
            } catch (e) {
              resolve(e.message);
            }
          }),
        );
      }

      await Promise.all(promises);
    } catch (e) {
      throw new LoggingException(e.message, HttpStatus.INTERNAL_SERVER_ERROR, {
        userId: user.userId,
      });
    }
    return true;
  }
}
