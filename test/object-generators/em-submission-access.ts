import { faker } from '@faker-js/faker';

export const genEmSubmissionAccess = <RepoType>(amount = 1): RepoType[] => {
  const emSubmissionAccess: RepoType[] = [];
  for (
    let emSubmissionAccessCount = 0;
    emSubmissionAccessCount < amount;
    emSubmissionAccessCount++
  ) {
    emSubmissionAccess.push({
      id: faker.number.int(),
      facilityId: faker.number.int(),
      orisCode: faker.number.int(),
      monitorPlanId: faker.string.sample(),
      state: faker.string.sample(),
      locations: faker.string.sample(),
      reportingPeriodId: faker.number.int(),
      status: faker.string.sample(),
      openDate: faker.date.anytime(),
      closeDate: faker.date.anytime(),
      emissionStatusCode: faker.string.sample(),
      submissionAvailabilityCode: faker.string.sample(),
      lastSubmissionId: faker.number.int(),
      submissionTypeCode: faker.string.sample(),
      severityLevel: faker.string.sample(),
      userid: faker.string.sample(),
      addDate: faker.date.anytime(),
      updateDate: faker.date.anytime(),
    } as unknown as RepoType);
  }
  return emSubmissionAccess;
};
