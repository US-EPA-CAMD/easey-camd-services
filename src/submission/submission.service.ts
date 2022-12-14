import { getManager } from 'typeorm';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { SubmissionsDTO } from '../dto/submission.dto';
import { LoggingException } from '@us-epa-camd/easey-common/exceptions';
import { SubmissionSet } from '../entities/submission-set.entity';
import { Plant } from '../entities/plant.entity';
import SubmissionBuilder from './submission-builder.service';

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
    userId: string,
    dto: SubmissionsDTO,
  ): Promise<boolean> {
    try {
      const promises = [];

      for (const item of dto.items) {
        promises.push(
          new Promise(async (resolve) => {
            //TODO: Implement permissions checks

            // Create Submission Set Record
            const submissionSet = new SubmissionSet();
            submissionSet.activityId = dto.activityId;
            submissionSet.addDate = new Date();
            submissionSet.monPlanId = item.monPlanId;
            submissionSet.userId = userId;
            const plant = await this.returnManager().findOne(Plant, {
              where: { orisCode: item.orisCode },
            });
            submissionSet.facId = plant.id;

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
                userId,
                plant.id,
                item,
              ),
            );

            innerPromises.push(
              ...this.submissionBuilder.handleQASubmission(
                submissionSetId,
                userId,
                plant.id,
                item,
              ),
            );
            /*
            innerPromises.push(...this.handleEmSubmission());
            */

            // Await all inner promises [Mp, Qa records, em records] to resolve then resolve the outer promise
            await Promise.all(innerPromises);
            resolve(true);
          }),
        );
      }

      await Promise.all(promises);
    } catch (e) {
      throw new LoggingException(e.message, HttpStatus.INTERNAL_SERVER_ERROR, {
        userId: userId,
      });
    }
    return true;
  }
}
