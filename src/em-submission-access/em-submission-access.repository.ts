import { EntityRepository, Repository } from 'typeorm';

import { EmSubmissionAccess } from '../entities/em-submission-access.entity';

@EntityRepository(EmSubmissionAccess)
export class EmSubmissionAccessRepository extends Repository<EmSubmissionAccess> {}
