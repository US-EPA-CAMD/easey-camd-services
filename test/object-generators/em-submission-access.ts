import { faker } from '@faker-js/faker';

export const genEmSubmissionAccess = <RepoType>(amount = 1): RepoType[] => {
  const emSubmissionAccess: RepoType[] = [];
  for (
    let emSubmissionAccessCount = 0;
    emSubmissionAccessCount < amount;
    emSubmissionAccessCount++
  ) {
    emSubmissionAccess.push({
      id: faker.datatype.number(),
      facilityId: faker.datatype.number(),
      orisCode: faker.datatype.number(),
      monitorPlanId: faker.datatype.string(),
      state: faker.datatype.string(),
      locations: faker.datatype.string(),
      reportingPeriodId: faker.datatype.number(),
      status: faker.datatype.string(),
      openDate: faker.datatype.datetime(),
      closeDate: faker.datatype.datetime(),
      emissionStatusCode: faker.datatype.string(),
      submissionAvailabilityCode: faker.datatype.string(),
      lastSubmissionId: faker.datatype.number(),
      submissionTypeCode: faker.datatype.string(),
      severityLevel: faker.datatype.string(),
      userid: faker.datatype.string(),
      addDate: faker.datatype.datetime(),
      updateDate: faker.datatype.datetime(),
    } as unknown as RepoType);
  }
  return emSubmissionAccess;
};
