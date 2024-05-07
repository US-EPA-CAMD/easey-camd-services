import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';

import { EmSubmissionAccess } from '../entities/em-submission-access.entity';

@Injectable()
export class EmSubmissionAccessRepository extends Repository<EmSubmissionAccess> {
  constructor(entityManager: EntityManager) {
    super(EmSubmissionAccess, entityManager);
  }
}
